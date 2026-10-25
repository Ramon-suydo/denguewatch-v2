import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, open, unlink } from "node:fs/promises";
import { setTimeout as pause } from "node:timers/promises";
export type Provenance = {
  url: string;
  retrieved_at: string;
  sha256: string;
  license: string;
  attribution: string;
  body?: string;
};
const allowed = new Set([
  "power.larc.nasa.gov",
  "archive-api.open-meteo.com",
  "overpass-api.de",
  "overpass.private.coffee",
  "api.opentopodata.org",
]);
export async function cachedRequest(
  path: string,
  url: string,
  license: string,
  attribution: string,
  options: { body?: string; maxAgeMs?: number } = {},
) {
  const parsed = new URL(url),
    local = relative(resolve("data/external"), resolve(path));
  if (
    local.startsWith("..") ||
    local.includes(":") ||
    parsed.username ||
    parsed.password ||
    (parsed.port && parsed.port !== "443") ||
    parsed.protocol !== "https:" ||
    !allowed.has(parsed.hostname) ||
    !path.startsWith("data/external/")
  )
    throw Error("Unsupported public data destination");
  await mkdir("data/external", { recursive: true });
  try {
    const bytes = await readFile(path, "utf8"),
      provenance: Provenance = JSON.parse(
        await readFile(path + ".provenance.json", "utf8"),
      );
    if (
      provenance.url !== url || provenance.body !== options.body ||
      provenance.sha256 !== createHash("sha256").update(bytes).digest("hex")
    )
      throw Error("Cached source provenance mismatch: " + path);
    if (
      !options.maxAgeMs ||
      Date.now() - Date.parse(provenance.retrieved_at) < options.maxAgeMs
    )
      return { data: JSON.parse(bytes), provenance };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (process.env.ENV_OFFLINE === "1")
    throw Error(
      `Offline cache absent. Download ${url} to ${path}, preserving provenance; see npm run environment:fetch.`,
    );
  const lockPath = "data/external/request-" + parsed.hostname + ".lock";
  let lock;
  try {
    lock = await open(lockPath, "wx");
  } catch {
    throw Error("Provider request already running: " + parsed.hostname);
  }
  try {
    const stampPath = lockPath + ".time";
    let last = 0;
    try {
      last = Number(await readFile(stampPath, "utf8"));
    } catch {}
    await pause(Math.max(0, 1300 - (Date.now() - last)));
    await writeFile(stampPath, String(Date.now()));
    const response = await fetch(url, {
      method: options.body ? "POST" : "GET",
      headers: {
        "User-Agent":
          "DengueWatch-research/2 (https://github.com/Ramon-suydo/denguewatch-v2)",
        ...(options.body
          ? { "Content-Type": "application/x-www-form-urlencoded" }
          : {}),
      },
      body: options.body,
      signal: AbortSignal.timeout(120000),
    });
    if (!response.ok)
      throw Error(
        `Source HTTP ${response.status}. Exact request ${url}; destination ${path}. Cached valid files preserved.`,
      );
    const data = await response.json(),
      bytes = JSON.stringify(data) + "\n";
    const provenance: Provenance = {
      url,
      retrieved_at: new Date().toISOString(),
      license,
      attribution,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
    await writeFile(path, bytes);
    await writeFile(
      path + ".provenance.json",
      JSON.stringify({ ...provenance, body: options.body }, null, 2) + "\n",
    );
    return { data, provenance };
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}
