import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { scanContent } from '../scripts/audit-secrets.mjs';
test('secret audit detects private patterns in text and compressed archive members without exposing values',()=>{
 const value='gh'+'p_'+'a'.repeat(36);
 assert.ok(scanContent(Buffer.from(value)).includes('github-token'));
 const archive=execFileSync('python',['-c',"import io,zipfile,sys;b=io.BytesIO();z=zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED);z.writestr('nested.txt','gh'+'p_'+'a'*36);z.close();sys.stdout.buffer.write(b.getvalue())"]);
 assert.ok(scanContent(archive).some(kind=>kind==='archive-member:nested.txt:github-token'));
 const corrupt=Buffer.from([0x50,0x4b,0x03,0x04,0,0]);assert.deepEqual(scanContent(corrupt),['unscannable-archive']);
});
