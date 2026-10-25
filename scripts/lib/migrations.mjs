import { readdir,readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export async function applyPendingMigrations(db){
 await db.query('create schema if not exists supabase_migrations');
 await db.query('create table if not exists supabase_migrations.schema_migrations(version text primary key,statements text[],name text)');
 await db.query('create table if not exists supabase_migrations.launch_checksums(version text primary key,sha256 text not null)');
 await db.query('revoke all on supabase_migrations.launch_checksums from public,anon,authenticated');
 for(const file of (await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort()){
  const version=file.split('_')[0],sql=await readFile('supabase/migrations/'+file,'utf8'),digest=createHash('sha256').update(sql).digest('hex');
  const saved=(await db.query('select sha256 from supabase_migrations.launch_checksums where version=$1',[version])).rows[0];
  if(saved && saved.sha256!==digest) throw Error('Applied migration differs; do not edit applied SQL.');
  if((await db.query('select version from supabase_migrations.schema_migrations where version=$1',[version])).rows.length){console.log('Already recorded: '+file);continue;}
  await db.query(sql);await db.query('insert into supabase_migrations.schema_migrations(version,statements,name) values($1,$2,$3)',[version,[sql],file]);
  await db.query('insert into supabase_migrations.launch_checksums values($1,$2)',[version,digest]);console.log('Applied: '+file);
 }
}
