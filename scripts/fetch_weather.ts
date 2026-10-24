import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { weekEnd, shiftDay } from "./lib/manila-data.ts";
const directory = "data/external";
await mkdir(directory, { recursive: true });
const responses = [];
for (let year = 2015; year <= 2023; year++) {
  const params = new URLSearchParams({
    latitude: "14.59932236",
    longitude: "120.98493761",
    start_date: `${year}-01-01`,
    end_date: `${year}-12-31`,
    hourly: "temperature_2m,relative_humidity_2m,precipitation",
    timezone: "Asia/Manila",
    models: "era5",
  });
  const url = "https://archive-api.open-meteo.com/v1/archive?" + params;
  const path = `${directory}/era5-manila-${year}.json`;
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!response.ok)
      throw Error(
        `Weather fetch failed (${response.status}). Download ${url} to ${path}; then rerun npm run weather:fetch. Existing files preserved.`,
      );
    text = await response.text();
    const data = JSON.parse(text);
    assert.ok(
      data.hourly?.time?.length > 8700,
      "Incomplete annual weather response",
    );
    await writeFile(path, text + "\n");
    await writeFile(
      path + ".provenance.json",
      JSON.stringify(
        {
          url,
          retrieved_at: new Date().toISOString(),
          license: "CC BY 4.0",
          attribution:
            "Open-Meteo; ERA5 / Copernicus Climate Change Service (C3S)",
          documentation:
            "https://open-meteo.com/en/docs/historical-weather-api",
          sha256: createHash("sha256")
            .update(text + "\n")
            .digest("hex"),
        },
        null,
        2,
      ) + "\n",
    );
    text += "\n";
  }
  const provenance = JSON.parse(
    await readFile(path + ".provenance.json", "utf8"),
  );
  assert.equal(provenance.url, url);
  assert.equal(
    provenance.sha256,
    createHash("sha256").update(text).digest("hex"),
  );
  const data = JSON.parse(text);
  assert.equal(data.timezone, "Asia/Manila");
  assert.equal(data.hourly_units.precipitation, "mm");
  assert.equal(data.hourly_units.temperature_2m, "°C");
  assert.equal(data.hourly_units.relative_humidity_2m, "%");
  const hours = data.hourly.time as string[];
  assert.equal(hours.length, (year % 4 === 0 ? 366 : 365) * 24);
  for (let i = 0; i < hours.length; i++)
    assert.equal(
      hours[i],
      new Date(Date.UTC(year, 0, 1) + i * 3600000).toISOString().slice(0, 16),
      "Weather hour continuity failed",
    );
  for (const key of ["temperature_2m", "relative_humidity_2m", "precipitation"])
    assert.equal(data.hourly[key].length, hours.length);
  responses.push({ year, data, provenance });
  console.log(`Validated ERA5 ${year}: ${hours.length} hours`);
}
const weeks = new Map<
  string,
  {
    week_ending: string;
    hours: number;
    rainfall_mm: number;
    temperature_c: number;
    humidity_percent: number;
  }
>();
const seen = new Set<string>();
for (const { data } of responses)
  for (let i = 0; i < data.hourly.time.length; i++) {
    const time = data.hourly.time[i] as string;
    assert.ok(!seen.has(time), "Duplicate weather hour");
    seen.add(time);
    const values = [
      "precipitation",
      "temperature_2m",
      "relative_humidity_2m",
    ].map((key) => data.hourly[key][i]);
    assert.ok(
      values.every((v) => typeof v === "number" && Number.isFinite(v)),
      "Null weather observation",
    );
    assert.ok(
      values[0] >= 0 && values[2] >= 0 && values[2] <= 100,
      "Weather unit/range check failed",
    );
    const end = weekEnd(time.slice(0, 10));
    const row = weeks.get(end) ?? {
      week_ending: end,
      hours: 0,
      rainfall_mm: 0,
      temperature_c: 0,
      humidity_percent: 0,
    };
    row.hours++;
    row.rainfall_mm += values[0];
    row.temperature_c += values[1];
    row.humidity_percent += values[2];
    weeks.set(end, row);
  }
const result = {
  source:
    "ERA5 reanalysis via Open-Meteo; not station gauges or real-time forecast vintages",
  availability:
    "Assume a minimum 7-day lag after the end of each weather week (provider documents ~5-day delay). Reanalysis revisions can use information unavailable historically; retrospective sensitivity, not validated operational weather skill.",
  coordinates: {
    latitude: 14.59932236,
    longitude: 120.98493761,
    source: "HDX Manila boundary center",
  },
  provenance: responses.map((r) => r.provenance),
  rows: [...weeks.values()]
    .filter((r) => r.hours === 168)
    .map((r) => ({
      ...r,
      week_start: shiftDay(r.week_ending, -6),
      temperature_c: r.temperature_c / r.hours,
      humidity_percent: r.humidity_percent / r.hours,
    })),
};
await mkdir("data/processed", { recursive: true });
await writeFile(
  "data/processed/weather_weekly.json",
  JSON.stringify(result, null, 2) + "\n",
);
await writeFile(
  "data/external/SOURCES.md",
  `# External sources\n\nERA5 hourly reanalysis via [Open-Meteo historical API](https://open-meteo.com/en/docs/historical-weather-api), CC BY 4.0; credit Open-Meteo and Copernicus C3S.\nManila point from HDX boundary center: 14.59932236, 120.98493761.\nTimezone Asia/Manila; Monday–Sunday weekly precipitation sum (mm), mean 2m temperature (°C), mean relative humidity (%).\nOnly complete 168-hour weeks retained. Weather features use weeks ending at least seven days before each origin to respect the documented five-day publication delay. Final reanalysis is retrospective and may be revised; no operational vintage skill claim.\n\n${responses.map((r) => `- ${r.year}: [exact request](${r.provenance.url}), retrieved ${r.provenance.retrieved_at}, SHA-256 ${r.provenance.sha256}`).join("\n")}\n`,
);
console.log(`Wrote ${result.rows.length} complete weather weeks.`);
