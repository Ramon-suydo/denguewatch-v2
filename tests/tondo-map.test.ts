import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {coordinateBounds,geometryIssue,rewindForD3,vertexCount} from "../scripts/geometry-qa";
import {geoArea} from "d3-geo";
import {feature as fromTopology} from "topojson-client";
import {useBarangayCases} from "../src/lib/area-map";
import {mapRamp,visionMatrices,simulatedLuminance,mapColor} from "../src/lib/map-colors.js";
const area=JSON.parse(await readFile("public/geo/tondo.json","utf8"));
test("map covers real source shapes and populations with explicit missing records and equal-area units",()=>{
 assert.equal(area.rows.length,area.metadata.requested);assert.equal(area.rows.filter((r:any)=>r.path).length,area.metadata.mapped);
 assert.equal(area.rows.filter((r:any)=>r.population!==null).length,area.metadata.populationKnownRows);
 assert.equal(area.rows.reduce((sum:number,r:any)=>sum+(r.population??0),0),area.metadata.populationKnownTotal);
 assert.equal(area.metadata.publishedPopulation-area.metadata.populationKnownTotal,area.metadata.populationDiscrepancy);
 assert.equal(area.metadata.populationKnownTotal+area.metadata.quarantined.reduce((sum:number,row:any)=>sum+row.population,0),area.metadata.publishedPopulation);
 assert.equal(area.metadata.quarantined[0].name,"Barangay 202-A");
 assert.match(area.metadata.quarantined[0].reason,/duplicates PSGC/);
 assert.deepEqual(area.rows.filter((r:any)=>!r.path).map((r:any)=>r.number),[21,22,23,24,27,40,113,114,115]);
 for(const row of area.rows){if(row.area!==null){assert.ok(row.area>0&&row.area<10);assert.ok(Math.abs(row.density-row.population/row.area)<1e-6);}else{assert.equal(row.population,null);assert.equal(row.psgc,null);assert.equal(row.density,null);}}
 assert.equal(area.rows.find((r:any)=>r.number===1).psgc,"1380601001");
 assert.equal(useBarangayCases().available,false);assert.equal(useBarangayCases().byPsgc.size,0);
});
test("map ramp preserves monotonic luminance in three color-vision simulations and absence is distinct from zero",()=>{
 for(const matrix of Object.values(visionMatrices)){const values=mapRamp.map(c=>simulatedLuminance(c,matrix));assert.ok(values.every((v,i)=>!i||v>values[i-1]));}
 assert.equal(mapColor(null,0,100),"url(#no-data)");assert.notEqual(mapColor(0,0,100),mapColor(null,0,100));
});

test("committed shared topology passes per-polygon validity, winding and five-percent area gates",async()=>{
 const source=JSON.parse(await readFile("data/geo/tondo-boundaries.geojson","utf8"));const city=JSON.parse(await readFile("data/geo/manila-boundary.geojson","utf8"));
 const topology=JSON.parse(await readFile("public/geo/tondo.topojson","utf8"));const simplified=fromTopology(topology,topology.objects.barangays) as any;
 const bounds=coordinateBounds(city.features);assert.deepEqual(bounds,area.metadata.geometryQa.manilaBounds);
 assert.equal(simplified.features.length,area.metadata.mapped);assert.equal(area.metadata.geometryQa.quarantinedGeometry.length,0);
 for(const f of source.features){assert.equal(geometryIssue(f,bounds),null);assert.ok(geoArea(rewindForD3(f))<2*Math.PI);}
 for(const f of simplified.features){assert.equal(geometryIssue(f,bounds),null);assert.ok(vertexCount(f)>=5);assert.ok(geoArea(f)<2*Math.PI);}
 for(const row of area.metadata.geometryQa.polygons){assert.ok(row.originalAreaKm2>0);assert.ok(row.simplifiedAreaKm2>0);assert.ok(Math.abs(row.areaChangePercent)<=5);assert.ok(row.renderedAreaShare<.35);}
 assert.ok(topology.arcs.length>0);assert.ok(area.metadata.geometryQa.simplifiedVertices<area.metadata.geometryQa.originalVertices);
 assert.equal(area.rows.reduce((highest:any,row:any)=>row.population>highest.population?row:highest,area.rows[0]).number,20);assert.equal(area.rows.find((row:any)=>row.number===20).population,45772);
});
test("invalid or collapsed polygons are rejected rather than drawn",async()=>{
 const fixtures=JSON.parse(await readFile("tests/fixtures/geometry-invalid.json","utf8"));
 for(const fixture of fixtures)assert.match(geometryIssue(fixture.feature,[0,0,10,10])??"",new RegExp(fixture.reason));
});
