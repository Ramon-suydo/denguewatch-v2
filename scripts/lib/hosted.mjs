import { config } from 'dotenv';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import pg from 'pg';
config({ path: ['.env.local', '.env'], quiet: true });
let localFingerprints=[];
try { localFingerprints=JSON.parse(await readFile('.artifacts/launch/exposure-fingerprints.json','utf8')); } catch(error) { if(error.code!=='ENOENT')throw Error('Invalid private exposure-guard configuration.'); }
let configuredFingerprints=[];
if(process.env.EXPOSED_CREDENTIAL_SHA256){
 try { configuredFingerprints=JSON.parse(process.env.EXPOSED_CREDENTIAL_SHA256); }
 catch { configuredFingerprints=process.env.EXPOSED_CREDENTIAL_SHA256.split(','); }
 if(!Array.isArray(configuredFingerprints))configuredFingerprints=[configuredFingerprints];
}
export const exposedCredentialFingerprints=[...new Set([...localFingerprints,...configuredFingerprints])].filter(value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value));
export function assertRotated() {
 if(!exposedCredentialFingerprints.length)throw Error('NEEDS OWNER: private exposure-guard fingerprint configuration is missing.');
 const value = process.env.DIRECT_DATABASE_URL;
 if (!value || process.env.CREDENTIALS_ROTATED !== '1') throw Error('NEEDS OWNER: rotate credentials, set DIRECT_DATABASE_URL and CREDENTIALS_ROTATED=1. No connection attempted.');
 let url;
 try { url = new URL(value); } catch { throw Error('Invalid database configuration.'); }
 const password = decodeURIComponent(url.password);
 if (!password || exposedCredentialFingerprints.includes(createHash('sha256').update(password).digest('hex'))) throw Error('NEEDS OWNER: configured password matches the recorded exposure. No connection attempted.');
 if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.port === '6543') throw Error('Use a direct/session PostgreSQL URL.');
 return url;
}
export async function connectDatabase() {
 const url = assertRotated();
 for (const key of ['sslmode','ssl','sslcert','sslkey','sslrootcert','uselibpqcompat']) url.searchParams.delete(key);
 const local = ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 const ca = process.env.DB_SSL_CA_FILE ? await readFile(process.env.DB_SSL_CA_FILE,'utf8') : undefined;
 const db = new pg.Client({ connectionString:url.toString(),connectionTimeoutMillis:15000,ssl:local?false:{rejectUnauthorized:true,...(ca?{ca}:{})} });
 try { await db.connect(); } catch { throw Error('Database connection failed; check rotated credentials, endpoint and trusted CA. No private details logged.'); }
 return db;
}
export async function verifyDatabase(db) {
 const tables = (await db.query("select c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind='r' and c.relname in ('community_reports','community_signals','staff_roles','staff_audit','reporting_v2_policy','report_challenges','surveillance_uploads')")).rows;
 if (tables.length!==7 || tables.some(t=>!t.relrowsecurity)) throw Error('Required reporting tables/RLS are not ready.');
 const grant = (await db.query("select has_table_privilege('anon','public.community_signals','select') or has_table_privilege('anon','public.community_signals','insert') or has_table_privilege('authenticated','public.community_signals','select') as unsafe")).rows[0];
 if (grant.unsafe) throw Error('Raw report grant verification failed.');
 await db.query("select * from public.community_signal_aggregates() limit 0");
 console.log('PASS: seven reporting tables have RLS, raw client grants denied, aggregate RPC resolves.');
}
export function failClosed(error) {
 // PostgreSQL/HTTP errors can contain private query parameters. Never print them.
 const message = error instanceof Error && /^(NEEDS OWNER:|Invalid database|Use a direct|Database connection failed|Required reporting|Raw report)/.test(error.message) ? error.message : 'Operation failed. No credentials, SQL parameters or report data logged. Inspect configuration privately.';
 console.error(message); process.exitCode=1;
}
