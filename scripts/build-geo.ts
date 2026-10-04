import {readFile,writeFile,mkdir} from "node:fs/promises";
import {createHash} from "node:crypto";
import assert from "node:assert/strict";
import {geoArea,geoAzimuthalEqualArea,geoPath} from "d3-geo";
import {topology} from "topojson-server";
import {feature as fromTopology} from "topojson-client";
import {presimplify,simplify} from "topojson-simplify";
import {coordinateBounds,geometryIssue,polygonRings,rewindForD3,signedArea,vertexCount,type Boundary} from "./geometry-qa";
const areas=JSON.parse(await readFile("config/areas.json","utf8"));
const arg=process.argv.indexOf("--area"),id=arg<0?"tondo":process.argv[arg+1],config=areas[id];assert.ok(config,"Area not configured");
const bytes=await readFile(`data/geo/${id}-boundaries.geojson`),raw=JSON.parse(bytes.toString());
const city=JSON.parse(await readFile("data/geo/manila-boundary.geojson","utf8")),bounds=coordinateBounds(city.features);
const source=JSON.parse(await readFile("data/geo/boundary-source.json","utf8"));
const populationBytes=await readFile(`data/geo/psa-2020-${id}.json`),populations=JSON.parse(populationBytes.toString());
assert.equal(Object.keys(populations).length,config.populationKnownRows);assert.equal(Object.values(populations).reduce((a:any,b:any)=>a+b,0),config.populationKnownTotal);
const measure=geoPath(geoAzimuthalEqualArea().rotate([-120.98,-14.62]).scale(6371.0088).translate([0,0]));
const originalAreas=new Map<number,number>(),quarantinedGeometry:{number:number;reason:string}[]=[];
// Select the exact Tondo source polygons before constructing shared topology. No rectangular cut invents borders.
const original:Boundary[]=raw.features.filter((f:any)=>f.properties.number>=config.firstBarangay&&f.properties.number<=config.lastBarangay);
assert.equal(original.length,raw.features.length,"Source contains features outside the configured area");
assert.equal(new Set(original.map(f=>f.properties!.number)).size,original.length,"Duplicate barangay number");
assert.equal(new Set(original.map(f=>f.properties!.psgc)).size,original.length,"Duplicate PSGC");
for(const f of original){assert.equal(f.properties!.sourceCity,"City of Manila");assert.equal(f.properties!.sourceName,`Barangay ${f.properties!.number}`);assert.match(f.properties!.psgc,/^13806\d{5}$/);rewindForD3(f);const issue=geometryIssue(f,bounds),area=measure.area(f);if(issue||!Number.isFinite(area)||area<=0||geoArea(f)>2*Math.PI)quarantinedGeometry.push({number:f.properties!.number,reason:issue??"Invalid spherical area/winding"});else originalAreas.set(f.properties!.number,area);}
const valid=original.filter(f=>originalAreas.has(f.properties!.number));assert.ok(valid.length,"No validated geometry");
const collection:any={type:"FeatureCollection",features:valid};
// One global threshold based on the smallest original ring; shared arcs simplify together.
const minRingArea=Math.min(...valid.flatMap(f=>polygonRings(f).flat().map(r=>Math.abs(signedArea(r)))));
let tolerance=minRingArea*.001,output:any,geo:any;
const weighted=presimplify(topology({barangays:collection},1_000_000) as any);
for(let attempt=0;attempt<24;attempt++){
 geo=simplify(weighted,tolerance);output=fromTopology(geo,geo.objects.barangays) as any;
 const failures=output.features.filter((f:Boundary)=>geometryIssue(f,bounds)||geoArea(f)>2*Math.PI||!(measure.area(f)>0)||Math.abs(measure.area(f)/originalAreas.get(f.properties!.number)!-1)>.05);
 if(!failures.length)break;if(attempt===23)throw Error("Geometry QA failed after conservative shared-arc simplification; no output written");tolerance/=2;
}
const projection=geoAzimuthalEqualArea().rotate([-120.98,-14.62]).fitExtent([[24,24],[876,656]],output),path=geoPath(projection).digits(2);
const features=new Map<number,Boundary>(output.features.map((f:Boundary)=>[f.properties!.number,f]));
const polygonStats=output.features.map((f:Boundary)=>{const before=valid.find(v=>v.properties!.number===f.properties!.number)!;return {number:f.properties!.number,originalVertices:vertexCount(before),simplifiedVertices:vertexCount(f),originalAreaKm2:originalAreas.get(f.properties!.number)!,simplifiedAreaKm2:measure.area(f),areaChangePercent:100*(measure.area(f)/originalAreas.get(f.properties!.number)!-1),renderedAreaShare:path.area(f)/(900*680)};});
for(const f of output.features){assert.equal(geometryIssue(f,bounds),null);assert.ok(geoArea(f)<2*Math.PI);}
assert.ok(polygonStats.every((r:any)=>Math.abs(r.areaChangePercent)<=5&&r.renderedAreaShare<.35),"Polygon area/render share exceeds QA gate");
const sortedAreas=polygonStats.map((r:any)=>r.originalAreaKm2).sort((a:number,b:number)=>a-b),median=sortedAreas[Math.floor(sortedAreas.length/2)];
const qa={manilaBounds:bounds,method:"Shared-arc Visvalingam simplification, quantization 1e6; threshold relative to smallest ring and halved until every polygon passes",toleranceDegreesSquared:tolerance,maxAreaChangePercent:5,maxRenderedAreaShare:.35,originalVertices:valid.reduce((s,f)=>s+vertexCount(f),0),simplifiedVertices:polygonStats.reduce((s:number,r:any)=>s+r.simplifiedVertices,0),quarantinedGeometry,areaOutliers:polygonStats.filter((r:any)=>r.originalAreaKm2>10*median).map((r:any)=>({number:r.number,areaKm2:r.originalAreaKm2,reason:"More than ten times median polygon area; retained for review, not disease risk"})),polygons:polygonStats};
const rows=Array.from({length:config.lastBarangay-config.firstBarangay+1},(_,i)=>{const number=i+config.firstBarangay,f=features.get(number),population=populations[number]??null,area=f?measure.area(f):null;return {number,psgc:original.find(r=>r.properties!.number===number)?.properties!.psgc??null,district:config.districts.find((d:any)=>number>=d.first&&number<=d.last).name,population,area,density:population!==null&&area!==null?population/area:null,path:f?path(f):null,centroid:f?path.centroid(f):null,boundaryIssue:quarantinedGeometry.find(r=>r.number===number)?.reason??null};});
assert.equal(config.populationKnownTotal+config.quarantined.reduce((sum:number,row:any)=>sum+row.population,0),config.populationTotal);
const artifact={metadata:{area:id,name:config.name,cityPsgc:config.cityPsgc,width:900,height:680,populationYear:2020,requested:rows.length,mapped:rows.filter(r=>r.path).length,populationKnownRows:Object.keys(populations).length,populationKnownTotal:config.populationKnownTotal,publishedPopulation:config.populationTotal,populationDiscrepancy:config.populationTotal-config.populationKnownTotal,quarantined:config.quarantined,geometryQa:qa,geometrySha256:createHash("sha256").update(bytes).digest("hex"),populationSha256:createHash("sha256").update(populationBytes).digest("hex"),projection:"Local Lambert azimuthal equal-area; sphere radius 6371.0088 km",boundarySource:source.source,boundaryLicense:source.license,boundaryValidOn:source.validOn,populationSource:"PSA Manila_0.pdf, 2020 CPH"},rows};
await mkdir("public/geo",{recursive:true});await writeFile(`public/geo/${id}.json`,JSON.stringify(artifact));await writeFile(`public/geo/${id}.topojson`,JSON.stringify(geo));
console.log(JSON.stringify({mapped:artifact.metadata.mapped,originalVertices:qa.originalVertices,simplifiedVertices:qa.simplifiedVertices,worstAreaChangePercent:Math.max(...polygonStats.map((r:any)=>Math.abs(r.areaChangePercent))),quarantinedGeometry,areaOutliers:qa.areaOutliers},null,2));
