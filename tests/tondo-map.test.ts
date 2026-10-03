import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
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
