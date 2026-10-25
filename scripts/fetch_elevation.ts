import { readFile, writeFile } from "node:fs/promises";
import { cachedRequest } from "./lib/source-cache.ts";
const grid = JSON.parse(
    await readFile(".artifacts/elevation-grid.json", "utf8"),
  ),
  all = [];
const sources = [];
for (let start = 0; start < grid.length; start += 100) {
  const points = grid.slice(start, start + 100),
    url =
      "https://api.opentopodata.org/v1/srtm90m?" +
      new URLSearchParams({
        locations: points.map((p: any) => `${p.lat},${p.lon}`).join("|"),
        interpolation: "bilinear",
      });
  const { data, provenance } = await cachedRequest(
    `data/external/srtm90m-grid-${start}.json`,
    url,
    "USGS SRTM public-domain data",
    "NASA / USGS SRTM, via Open Topo Data",
  );
  if (data.status !== "OK" || data.results.length !== points.length)
    throw Error("Incomplete SRTM batch");
  for (let i = 0; i < points.length; i++) {
    const result = data.results[i];
    if (
      result.dataset !== "srtm90m" ||
      Math.abs(result.location.lat - points[i].lat) > 1e-6 ||
      Math.abs(result.location.lng - points[i].lon) > 1e-6
    )
      throw Error("Elevation coordinate or dataset mismatch");
    all.push({ ...points[i], elevation: result.elevation });
  }
  sources.push(provenance);
  console.log("SRTM samples " + all.length + "/" + grid.length);
}
await writeFile(
  "data/processed/elevation_samples.json",
  JSON.stringify(all) + "\n",
);
await writeFile(
  "data/processed/elevation_sources.json",
  JSON.stringify(sources, null, 2) + "\n",
);
