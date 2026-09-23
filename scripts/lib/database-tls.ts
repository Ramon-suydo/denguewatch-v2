import { readFile, stat } from 'node:fs/promises';
import { X509Certificate } from 'node:crypto';

export async function readDatabaseCa(path?: string): Promise<string | undefined> {
  if (!path?.trim()) return undefined;
  const value = path.trim();
  let info;
  try { info = await stat(value); }
  catch { throw new Error('DB_SSL_CA_FILE cannot be accessed. Set it to an existing PEM certificate file.'); }
  if (!info.isFile()) throw new Error('DB_SSL_CA_FILE must point to a certificate file, not a directory (for example, the prod-ca-2021.crt file inside your certificate folder).');
  const ca = await readFile(value, 'utf8');
  const certificates = ca.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
  if (!certificates?.length) throw new Error('DB_SSL_CA_FILE must contain a PEM certificate.');
  try { for (const certificate of certificates) new X509Certificate(certificate); }
  catch { throw new Error('DB_SSL_CA_FILE contains an invalid PEM certificate.'); }
  return ca;
}
