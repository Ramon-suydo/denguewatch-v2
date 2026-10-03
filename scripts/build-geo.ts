import {readFile,writeFile,mkdir} from "node:fs/promises";
import {createHash} from "node:crypto";
import assert from "node:assert/strict";
import {geoArea,geoAzimuthalEqualArea,geoPath} from "d3-geo";
import {topology} from "topojson-server";
const areas=JSON.parse(await readFile("config/areas.json","utf8"));
const arg=process.argv.indexOf("--area"),id=arg<0?"tondo":process.argv[arg+1];
const config=areas[id];assert.ok(config,"Area not configured");
const bytes=await readFile(`data/geo/${id}-boundaries.geojson`),raw=JSON.parse(bytes.toString());
const populationBytes=await readFile(`data/geo/psa-2020-${id}.json`),populations=JSON.parse(populationBytes.toString());
assert.equal(Object.keys(populations).length,config.populationKnownRows);assert.equal(Object.values(populations).reduce((a:any,b:any)=>a+b,0),config.populationKnownTotal);
// Clockwise exterior rings for d3 spherical paths; preserve holes and coordinates.
for(const feature of raw.features)if(geoArea(feature)>2*Math.PI){const polygons=feature.geometry.type==="Polygon"?[feature.geometry.coordinates]:feature.geometry.coordinates;for(const polygon of polygons)for(const ring of polygon)ring.reverse();}
const projection=geoAzimuthalEqualArea().rotate([-120.98,-14.62]).fitExtent([[30,30],[870,650]],raw);
const path=geoPath(projection).digits(3),measure=geoPath(geoAzimuthalEqualArea().rotate([-120.98,-14.62]).scale(6371.0088).translate([0,0]));
const features=new Map(raw.features.map((feature:any)=>[feature.properties.number,feature]));
const rows=Array.from({length:config.lastBarangay-config.firstBarangay+1},(_,i)=>{
 const number=i+config.firstBarangay,feature:any=features.get(number),population=populations[number]??null;
 const area=feature?measure.area(feature):null;assert.ok(area===null||(area>0&&area<100),"Unexpected polygon area");
 return {number,psgc:feature?.properties.psgc??null,district:config.districts.find((d:any)=>number>=d.first&&number<=d.last).name,population,area,density:population!==null&&area!==null?population/area:null,path:feature?path(feature):null,centroid:feature?path.centroid(feature):null};
});
assert.equal(new Set(rows.filter(r=>r.psgc).map(r=>r.psgc)).size,raw.features.length);
assert.equal(config.populationKnownTotal+config.quarantined.reduce((sum:number,row:any)=>sum+row.population,0),config.populationTotal);
const artifact={metadata:{area:id,name:config.name,cityPsgc:config.cityPsgc,width:900,height:680,populationYear:2020,requested:rows.length,mapped:rows.filter(r=>r.path).length,populationKnownRows:Object.keys(populations).length,populationKnownTotal:config.populationKnownTotal,publishedPopulation:config.populationTotal,populationDiscrepancy:config.populationTotal-config.populationKnownTotal,quarantined:config.quarantined,geometrySha256:createHash("sha256").update(bytes).digest("hex"),populationSha256:createHash("sha256").update(populationBytes).digest("hex"),projection:"Local Lambert azimuthal equal-area; sphere radius 6371.0088 km",boundarySource:"NAMRIA/PSA snapshot via bendlikeabamboo, 2023-10-24/hierarchical_t0p005",boundaryLicense:"MIT (repository); upstream NAMRIA metadata retained in source documentation",populationSource:"PSA Manila_0.pdf, 2020 CPH"},rows};
await mkdir("public/geo",{recursive:true});await writeFile(`public/geo/${id}.json`,JSON.stringify(artifact));
await writeFile(`public/geo/${id}.topojson`,JSON.stringify(topology({barangays:raw})));
console.log(JSON.stringify(artifact.metadata,null,2));
