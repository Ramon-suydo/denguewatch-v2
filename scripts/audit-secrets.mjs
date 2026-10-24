import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const git = (...args) => execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024 });
const patterns = [
 ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
 ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
 ['supabase-secret', /\bsb_secret_[A-Za-z0-9_-]{15,}\b/],
 ['aws-access-key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
 ['database-password', /postgres(?:ql)?:\/\/[^:\s]+:([^@\s]+)@/],
];
let privateValues = [];
try {
 const env = await readFile('.env.local', 'utf8');
 privateValues = [...env.matchAll(/^([A-Z_]+)\s*=\s*(.+)$/gm)]
  .filter(([, key]) => !key.startsWith('VITE_') && /PASSWORD|SECRET|TOKEN|DATABASE_URL|SERVICE_ROLE/.test(key))
  .map(([, , value]) => value.trim().replace(/^['"]|['"]$/g, ''))
  .filter(value => value.length >= 16 && !/^(true|false)$/.test(value));
 for (const value of [...privateValues]) {
  try { const password = decodeURIComponent(new URL(value).password); if (password.length >= 8) privateValues.push(password); } catch {}
 }
} catch (error) { if (error.code !== 'ENOENT') throw error; }
const objects = git('rev-list', '--objects', '--all').toString().trim().split('\n');
const findings = []; let blobs = 0;
for (const line of objects) {
 const split = line.indexOf(' '); const sha = split < 0 ? line : line.slice(0, split);
 const path = split < 0 ? '' : line.slice(split + 1);
 if (git('cat-file', '-t', sha).toString().trim() !== 'blob') continue;
 blobs++;
 if ((/(^|\/)\.env(?:\..*)?$/.test(path) && !path.endsWith('.env.example')) || /(^|\/)certs\//.test(path)) findings.push({ sha, path, kind: 'prohibited-path' });
 const buffer = git('cat-file', 'blob', sha);
 if (buffer.includes(0)) continue;
 const content = buffer.toString('utf8');
 for (const [kind, pattern] of patterns) {
  const match = pattern.exec(content);
  if (match && !(kind === 'database-password' && /^(?:password|YOUR_PASSWORD|\[.*\]|<.*>|example|test)$/i.test(match[1]))) findings.push({ sha, path, kind });
 }
 if (privateValues.some(value => content.includes(value))) findings.push({ sha, path, kind: 'local-private-value' });
 for (const token of content.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? []) {
  try { if (JSON.parse(Buffer.from(token.split('.')[1], 'base64url')).role === 'service_role') findings.push({ sha, path, kind: 'service-role-jwt' }); } catch {}
 }
}
const report = { scope: 'All locally reachable refs and history; heuristic patterns plus private local environment values. Not a guarantee against unknown secrets or unreachable remote objects.', blobs, findings };
await mkdir('.artifacts', { recursive: true });
await writeFile('.artifacts/secrets-audit.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (findings.length) process.exitCode = 1;
