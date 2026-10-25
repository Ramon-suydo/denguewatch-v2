import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { cachedRequest } from "./lib/source-cache.ts";
const url =
  "https://power.larc.nasa.gov/api/temporal/daily/point?" +
  new URLSearchParams({
    parameters: "PRECTOTCORR,T2M,RH2M",
    community: "AG",
    longitude: "120.98493761",
    latitude: "14.59932236",
    start: "20150101",
    end: "20231231",
    format: "JSON",
    "time-standard": "LST",
  });
const { data, provenance } = await cachedRequest(
  "data/external/power-manila-2015-2023.json",
  url,
  "NASA open data; US government data",
  "NASA POWER / NASA Langley Research Center; MERRA-2 / GMAO",
);
assert.equal(data.header.time_standard, "LST");
assert.equal(data.parameters.PRECTOTCORR.units, "mm/day");
assert.equal(data.parameters.T2M.units, "C");
assert.equal(data.parameters.RH2M.units, "%");
const variables = data.properties.parameter;
for (const key of ["PRECTOTCORR", "T2M", "RH2M"])
  assert.ok(Object.keys(variables[key]).length >= 3287);
await writeFile(
  "data/processed/power_daily.json",
  JSON.stringify({
    source: "NASA POWER MERRA-2",
    time_standard:
      "LST (solar swath), not Asia/Manila civil time; cross-check only",
    provenance,
    units: data.parameters,
    rows: Object.keys(variables.T2M)
      .sort()
      .map((key) => ({
        date: `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`,
        rainfall_mm: variables.PRECTOTCORR[key],
        temperature_c: variables.T2M[key],
        humidity_percent: variables.RH2M[key],
      })),
  }) + "\n",
);
const sources = "";
await writeFile(
  "data/external/POWER.md",
  sources +
    `\n## NASA POWER\n\n[Daily API documentation](https://power.larc.nasa.gov/docs/services/api/temporal/daily/).\n[Exact request](${url}); retrieved ${provenance.retrieved_at}; SHA256 ${provenance.sha256}.\nPRECTOTCORR mm/day, T2M Celsius, RH2M percent, MERRA-2 point estimates, meteorology grid 0.5 by 0.625 degrees. LST is a solar swath, not a civil timezone; this independent weekly cross-check has a boundary-time limitation. No per-city weather generated.\nNASA open government data. Attribution: NASA POWER, NASA Langley Research Center; NASA GMAO MERRA-2.\n`,
);
console.log("Validated NASA POWER daily response and cached exact provenance.");
