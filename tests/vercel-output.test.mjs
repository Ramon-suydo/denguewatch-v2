import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {outputConfiguration} from '../scripts/package-vercel.mjs';
const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
const output=outputConfiguration(config);
const headersFor=pathname=>Object.assign({},...output.routes.filter(r=>r.headers&&new RegExp('^'+r.src+'$').test(pathname)).map(r=>r.headers));
test('prebuilt deployment preserves distinct page, map and worker CSPs',()=>{
 const normal=headersFor('/'),map=headersFor('/risk-map'),nested=headersFor('/risk-map/Manila'),worker=headersFor('/assets/maplibre-gl-worker-abc.js');
 assert.equal(normal['Content-Security-Policy'],config.headers[3].headers[0].value);
 assert.equal(map['Content-Security-Policy'],config.headers[1].headers[0].value);
 assert.equal(nested['Content-Security-Policy'],map['Content-Security-Policy']);
 assert.equal(worker['Content-Security-Policy'],config.headers[2].headers[0].value);
 assert.equal(normal['X-Content-Type-Options'],'nosniff');
 assert.equal(headersFor('/sw.js')['Cache-Control'],'no-cache');
});
test('physical source/model JSON and map assets resolve before SPA rewrites',()=>{
 const filesystem=output.routes.findIndex(r=>r.handle==='filesystem');
 assert.ok(filesystem>0);
 assert.ok(output.routes.slice(filesystem+1).every(r=>r.dest));
 const fallback=new RegExp('^'+output.routes.at(-1).src+'$');
 for(const p of ['/live-manila/weekly.json','/research/manila-extras.json','/basemap/metro-manila.pmtiles','/live-manila-append-template.csv'])assert.equal(fallback.test(p),false,p);
 assert.equal(fallback.test('/our-model'),true);
});
test('unknown high-level header sources require explicit review',()=>{
 assert.throws(()=>outputConfiguration({headers:[{source:'/unreviewed/:dynamic',headers:[]}],rewrites:[]}),/Review unsupported/);
});
