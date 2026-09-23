import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rootCertificates } from 'node:tls';
import { readDatabaseCa } from '../scripts/lib/database-tls.ts';

test('CA configuration accepts PEM files and explains directory/missing/invalid paths', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'denguewatch-ca-'));
  const file = join(directory, 'test.crt');
  try {
    assert.equal(await readDatabaseCa(undefined), undefined);
    assert.equal(await readDatabaseCa('  '), undefined);
    await assert.rejects(readDatabaseCa(directory), /file, not a directory/);
    await assert.rejects(readDatabaseCa(file), /existing PEM certificate file/);
    await writeFile(file, 'not a certificate');
    await assert.rejects(readDatabaseCa(file), /must contain a PEM certificate/);
    await writeFile(file, '-----BEGIN CERTIFICATE-----\ninvalid\n-----END CERTIFICATE-----');
    await assert.rejects(readDatabaseCa(file), /invalid PEM certificate/);
    await writeFile(file, rootCertificates[0]);
    assert.equal(await readDatabaseCa(file), rootCertificates[0]);
  } finally {
    await unlink(file).catch(() => {});
    await rmdir(directory);
  }
});
