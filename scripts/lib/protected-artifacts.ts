import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
export type ProtectedFingerprint={sha256:string;git_text_eol:boolean};
// Respect only the existing Git text checkout conversion. Binary/-text source bytes
// remain exact. No values, whitespace other than CRLF pairs, or source rows change.
export function artifactDigest(bytes:Buffer,gitTextEol:boolean){
 const canonical=gitTextEol?Buffer.from(bytes.toString('latin1').replace(/\r\n/g,'\n'),'latin1'):bytes;
 return createHash('sha256').update(canonical).digest('hex');
}
export function verifyProtectedArtifacts(files:Record<string,ProtectedFingerprint>){
 for(const [path,record] of Object.entries(files))assert.equal(artifactDigest(readFileSync(path),record.git_text_eol),record.sha256,path+' changed');
 return Object.keys(files).length;
}
