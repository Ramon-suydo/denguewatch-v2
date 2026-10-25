import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory() ? files(dir + "/" + e.name) : [dir + "/" + e.name],
      ),
    )
  ).flat();
}
const assets = (await files("dist"))
  .filter(
    (p) =>
      p.startsWith("dist/assets/") || /dist\/img\/manila-\d+\.(avif|webp)$/.test(p) || p === "dist/geo/philippines.geojson" ||
      [
        "dist/index.html",
        "dist/manifest.webmanifest",
        "dist/icon.svg",
      ].includes(p) ||
      (p.startsWith("dist/api/v2/") && !["dist/api/v2/weather.json","dist/api/v2/outlook-weather.json"].includes(p)),
  )
  .map((p) => "/" + p.slice(5));
const hash = createHash("sha256");
for (const path of assets) hash.update(await readFile("dist" + path));
const version = "dw-research-" + hash.digest("hex").slice(0, 16);
const worker = `const CACHE=${JSON.stringify(version)};const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('dw-research-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/admin'))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).catch(async()=>await caches.match('/index.html')||new Response('Offline. Open the app online once to cache the public research pages.',{status:503})));return;
 }
 if(ASSETS.includes(url.pathname))event.respondWith(caches.open(CACHE).then(async cache=>await cache.match(url.pathname)||fetch(request)));
});
`;
await writeFile("dist/sw.js", worker);
console.log(
  `PWA: ${assets.length} public assets cached under ${version}; no Supabase/admin/report mutations cached.`,
);
