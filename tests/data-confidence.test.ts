import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dataConfidence, coverageSegments } from "../src/lib/data-confidence";
const snapshot=JSON.parse(await readFile("public/demo-snapshot.json","utf8"));
test("confidence totals, overlap differences and gaps come from the verified Manila snapshot",()=>{
 const result=dataConfidence(snapshot), id=snapshot.cities.find((c:{name:string})=>c.name==="MANILA CITY").id;
 assert.equal(result.rows.length,snapshot.history.filter((r:{lgu_id:string})=>r.lgu_id===id).length);
 assert.equal(result.verification,true); assert.equal(result.latest,"2023-12-02");
 assert.deepEqual(result.overlaps.map(r=>r.day-r.week),[21,60,8]);
 const weekly=result.sources.find(s=>s.period==="week")!;
 assert.equal(coverageSegments(weekly.rows.map(r=>r.period_start),7).filter(s=>!s.reported).length,3);
 const changed=structuredClone(snapshot);changed.history.find((r:{lgu_id:string})=>r.lgu_id===id).source_sha256="changed";
 assert.equal(dataConfidence(changed).verification,false);
});
