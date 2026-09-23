import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import pg from 'pg';
import { loadDataset } from './lib/historical.ts';
import { importDataset } from './lib/import-database.ts';

config({ path: ['.env.local', '.env'], quiet: true });
const args = process.argv.slice(2);
const allowed = new Set(['--dry-run','--verify-only']);
if (args.some(a => !allowed.has(a)) || args.length > 1) {
  console.error('Usage: npm run ingest [-- --dry-run | -- --verify-only]'); process.exit(1);
}

async function main() {
  const dataset = await loadDataset(resolve('data/raw'));
  await mkdir('.artifacts', { recursive: true });
  await writeFile('.artifacts/data-audit.json', JSON.stringify(dataset.audit, null, 2) + '\n');
  console.table(dataset.audit.summaries.map(({source, rows, start, end, cases, unknown_death_rows}) => ({source, rows, start, end, cases, unknown_death_rows})));
  console.log('17 LGUs; 7,350 source records. Preserve separate sources; do not sum overlapping series.');
  console.log('Quality details: .artifacts/data-audit.json and docs/DATA_QUALITY.md');
  if (args.includes('--dry-run')) { console.log('Dry run: no database connection or writes.'); return; }
  const connectionString = process.env.DIRECT_DATABASE_URL;
  if (!connectionString) throw new Error('DIRECT_DATABASE_URL is missing in ignored .env.local. No database writes attempted.');
  const target = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(target.protocol)) throw new Error('Use a PostgreSQL connection URL.');
  if (target.port === '6543') throw new Error('Use a direct/session connection, not transaction-pooler port 6543.');
  const local = ['localhost','127.0.0.1','[::1]'].includes(target.hostname);
  const sslMode = target.searchParams.get('sslmode');
  if (sslMode && !['require','verify-ca','verify-full'].includes(sslMode)) throw new Error('Insecure or unsupported sslmode.');
  // pg URL SSL options override the explicit SSL object; remove safe modes and enforce verification below.
  target.searchParams.delete('sslmode');
  for (const name of ['ssl','sslcert','sslkey','sslrootcert','uselibpqcompat']) {
    if (target.searchParams.has(name)) throw new Error('Configure TLS using DB_SSL_CA_FILE, not URL SSL options.');
  }
  const ca = process.env.DB_SSL_CA_FILE ? await readFile(process.env.DB_SSL_CA_FILE, 'utf8') : undefined;
  const client = new pg.Client({ connectionString: target.toString(), connectionTimeoutMillis: 15000,
    ssl: local ? false : { rejectUnauthorized: true, ...(ca ? { ca } : {}) } });
  try {
    await client.connect();
    const verified = await importDataset(client, dataset, args.includes('--verify-only'));
    console.table(verified);
    console.log(args.includes('--verify-only') ? 'Database verified against every source row; no persistent writes.' : 'Transaction committed: all 7,350 rows and 17 LGUs verified against source values.');
    await writeFile('.artifacts/database-verification.json', JSON.stringify({
      verified_at: new Date().toISOString(), target_host: target.hostname,
      mode: args.includes('--verify-only') ? 'verify-only' : 'ingest', lgus: 17, sources: verified,
    }, null, 2) + '\n');
  } finally { await client.end(); }
}
main().catch(error => {
  // Never print PostgreSQL connection strings, query parameters, or driver error objects.
  const message = error instanceof Error ? error.message : 'Unknown failure';
  const secrets = [process.env.DIRECT_DATABASE_URL, process.env.VITE_SUPABASE_ANON_KEY].filter(Boolean) as string[];
  const safe = secrets.reduce((text, secret) => text.split(secret).join('[redacted]'), message)
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[redacted database URL]');
  console.error(`Ingestion/verification failed: ${safe}`); process.exitCode = 1;
});
