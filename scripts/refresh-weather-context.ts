import { open, readFile, writeFile, unlink } from "node:fs/promises";
import {
  dailyWeatherContext,
  type WeatherContext,
} from "./lib/weather-context.ts";
import { cachedRequest } from "./lib/source-cache.ts";
import { hourlyManila, aggregateDaily } from "./lib/environment.ts";
const path = "public/api/v2/weather.json",
  lockPath = "data/external/weather-refresh.lock";
let lock;
try {
  lock = await open(lockPath, "wx");
} catch {
  throw Error("Weather refresh is already running; no provider call made.");
}
try {
  let previous: WeatherContext | null = null;
  try {
    previous = JSON.parse(await readFile(path, "utf8"));
  } catch {}
  const now = new Date(),
    stamp = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  const result = await dailyWeatherContext(previous, now, async () => {
    const end = new Date(now.getTime() - 8 * 86400000)
        .toISOString()
        .slice(0, 10),
      start = new Date(now.getTime() - 70 * 86400000)
        .toISOString()
        .slice(0, 10);
    const url =
      "https://archive-api.open-meteo.com/v1/archive?" +
      new URLSearchParams({
        latitude: "14.59932236",
        longitude: "120.98493761",
        start_date: start,
        end_date: end,
        hourly: "temperature_2m,relative_humidity_2m,precipitation",
        timezone: "Asia/Manila",
        models: "era5",
      });
    const { data } = await cachedRequest(
      `data/external/weather-context-${stamp}.json`,
      url,
      "CC BY 4.0",
      "Open-Meteo / Copernicus C3S / ECMWF ERA5",
    );
    return aggregateDaily(hourlyManila(data));
  });
  let exported: unknown = result;
  if (result.status === "available-context-only") {
    const receiptDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(result.attempted_at));
    const provenance = JSON.parse(
      await readFile(
        `data/external/weather-context-${receiptDate}.json.provenance.json`,
        "utf8",
      ),
    );
    exported = { ...result, provenance };
  }
  await writeFile(path, JSON.stringify(exported, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
} finally {
  await lock.close();
  await unlink(lockPath);
}
