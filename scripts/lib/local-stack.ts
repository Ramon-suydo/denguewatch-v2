export function assertLocalStack(apiValue: string, databaseValue: string) {
  const api = new URL(apiValue),
    database = new URL(databaseValue);
  const local = new Set(["127.0.0.1", "localhost", "[::1]"]);
  if (
    api.protocol !== "http:" ||
    !local.has(api.hostname) ||
    !["postgres:", "postgresql:"].includes(database.protocol) ||
    !local.has(database.hostname)
  )
    throw Error("Local setup refuses non-loopback API/database URLs.");
  return { api: api.toString(), database: database.toString() };
}
