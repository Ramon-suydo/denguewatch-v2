import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {score,level,probabilityColor,type ModelBundle} from '../src/ml/scorer';
const bundle=JSON.parse(readFileSync('public/ml/models.json','utf8')) as ModelBundle;
const fixture=JSON.parse(readFileSync('tests/fixtures/ml-parity.json','utf8')) as {version:string;rows:{features:number[];seasonal_raw:number;expected:Record<string,{raw:number;probability:number;class:number}>}[]};
test('TypeScript exactly reproduces sklearn classes and probabilities within 1e-9 on 600 rows and all five methods',()=>{assert.equal(bundle.version,fixture.version);assert.ok(fixture.rows.length>=500);let checked=0;for(const row of fixture.rows)for(const [name,expected] of Object.entries(row.expected)){const actual=score(bundle,row.features,name,row.seasonal_raw);assert.equal(actual.class,expected.class,`${name} class row ${checked}`);assert.ok(Math.abs(actual.probability-expected.probability)<=1e-9,`${name} probability row ${checked}`);assert.ok(Math.abs(actual.raw-expected.raw)<=1e-9);checked++;}assert.ok(checked>=2500);});
test('missing inputs do not fabricate probabilities; probability bands are monotone and unknown areas grey',()=>{assert.throws(()=>score(bundle,[]));assert.equal(level(null,bundle.bands),null);assert.equal(probabilityColor(null,bundle.bands),'#aebbc4');let previous=-1;for(let i=0;i<=100;i++){const current=level(i/100,bundle.bands)!;assert.ok(current>=previous);previous=current;}});
