import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import config from "../vite.config";
const invoke = () =>
  (config as (env: { command: string; mode: string }) => unknown)({
    command: "build",
    mode: "production",
  });
test("client builds reject private environment names and service-role JWTs", () => {
  const names = ["VITE_SERVICE_ROLE_KEY", "VITE_SUPABASE_ANON_KEY"];
  const previous = names.map((k) => process.env[k]);
  try {
    process.env.VITE_SERVICE_ROLE_KEY = "not-a-real-secret";
    assert.throws(invoke, /private credential/);
    delete process.env.VITE_SERVICE_ROLE_KEY;
    for (const role of ["service_role", "authenticated"]) {
      const payload = Buffer.from(JSON.stringify({ role })).toString(
        "base64url",
      );
      process.env.VITE_SUPABASE_ANON_KEY = `eyJhbGciOiJub25lIn0.${payload}.isolated-test`;
      assert.throws(invoke, /Private Supabase role/);
    }
  } finally {
    names.forEach((k, i) => {
      if (previous[i] === undefined) delete process.env[k];
      else process.env[k] = previous[i];
    });
  }
});
test("versioned public research endpoints contain no individual reports and cannot claim live risk", async () => {
  const manila = JSON.parse(
      await readFile("public/api/v2/manila.json", "utf8"),
    ),
    ncr = JSON.parse(await readFile("public/api/v2/ncr.json", "utf8"));
  assert.equal(manila.historical_only, true);
  assert.equal(manila.community_included, false);
  assert.equal(ncr.data_as_of, "2021-01-10");
  assert.equal(ncr.shapes.length, 17);
  for (const s of manila.snapshots) {
    assert.equal(s.model, "naive");
    assert.equal(s.current_risk.level, "Insufficient current data");
    assert.ok(s.as_of < "2024");
  }
  for (const file of ["manila", "ncr", "backtest"]) {
    const text = await readFile(`public/api/v2/${file}.json`, "utf8");
    for (const key of [
      "reference_code",
      "contact_value",
      "consent_at",
      "note_text",
      "symptoms",
    ])
      assert.ok(!text.includes('"' + key + '"'));
  }
});
test("PWA allowlist contains public assets only and security headers prohibit framing and script injection", async () => {
  const worker = await readFile("scripts/build-pwa.mjs", "utf8");
  assert.match(worker, /request.method!=='GET'/);
  assert.match(worker, /url.origin!==self.location.origin/);
  assert.match(worker, /startsWith\('\/admin'\)/);
  assert.ok(!worker.includes("supabase.co"));
  const configuration = JSON.parse(await readFile("vercel.json", "utf8"));
  const policies=configuration.headers.flatMap((rule:any)=>rule.headers.filter((h:any)=>h.key==='Content-Security-Policy').map((h:any)=>({source:rule.source,csp:h.value as string})));
  assert.equal(policies.length,3);
  for(const {source,csp} of policies){
    assert.ok(csp.includes("script-src 'self'"));
    assert.ok(csp.includes("frame-ancestors 'none'"));
    assert.ok(!csp.includes("unsafe-eval"));
    assert.match(csp,/(?:^|; )style-src 'self';/);
    if(source==='/risk-map/:path*'){
      assert.ok(csp.includes("style-src-attr 'unsafe-inline'"));
      assert.ok(csp.includes('https://tiles.openfreemap.org'));
      assert.equal(csp.match(/unsafe-inline/g)?.length,1);
    }else if(source==='/assets/maplibre-gl-worker-:hash.js'){
      assert.ok(csp.includes('https://tiles.openfreemap.org'));
      assert.ok(!csp.includes('supabase.co'));
      assert.ok(!csp.includes('unsafe-inline'));
      assert.ok(csp.includes("style-src-attr 'none'"));
    }else{
      assert.equal(source,'/((?!risk-map(?:/|$)|assets/maplibre-gl-worker-[^/]+[.]js$).*)');
      assert.ok(!csp.includes('unsafe-inline'));
      assert.ok(csp.includes("style-src-attr 'none'"));
      assert.ok(!csp.includes('tiles.openfreemap.org'));
    }
  }

});
