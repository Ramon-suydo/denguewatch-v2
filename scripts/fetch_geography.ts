import { readFile, writeFile } from "node:fs/promises";
import { cachedRequest } from "./lib/source-cache.ts";
const geo = JSON.parse(
  await readFile("data/geo/ncr-boundaries.geojson", "utf8"),
);
const coords: number[][] = [];
function points(v: any) {
  if (typeof v[0] === "number") coords.push(v);
  else v.forEach(points);
}
geo.features.forEach((f: any) => points(f.geometry.coordinates));
const bbox = [
  Math.min(...coords.map((p) => p[1])) - 0.02,
  Math.min(...coords.map((p) => p[0])) - 0.02,
  Math.max(...coords.map((p) => p[1])) + 0.02,
  Math.max(...coords.map((p) => p[0])) + 0.02,
].join(",");
const query = `[out:json][timeout:90];(way["waterway"~"^(river|stream|canal|drain|ditch)$"](${bbox});way["natural"="water"](${bbox});way["natural"="coastline"](${bbox});relation["natural"="water"](${bbox}););out geom;`;
const url =
  "https://overpass.private.coffee/api/interpreter?" +
  new URLSearchParams({ data: query });
const { data, provenance } = await cachedRequest(
  "data/external/osm-ncr-water.json",
  url,
  "ODbL 1.0",
  "Copyright OpenStreetMap contributors; https://www.openstreetmap.org/copyright",
);
if (!Array.isArray(data.elements) || data.remark)
  throw Error(
    "Incomplete Overpass response: " + (data.remark ?? "no elements"),
  );
await writeFile(
  "data/processed/osm-water-source.json",
  JSON.stringify(
    {
      ...provenance,
      query,
      bbox,
      osm_timestamp: data.osm3s?.timestamp_osm_base,
      elements: data.elements.length,
    },
    null,
    2,
  ) + "\n",
);
console.log("Validated OSM water features: " + data.elements.length);
