import { spawnSync } from 'node:child_process';
import { verifyRetentionWorkflow } from './lib/retention-workflow.mjs';
import { connectDatabase,verifyDatabase,failClosed } from './lib/hosted.mjs';
const result=spawnSync(process.execPath,['node_modules/tsx/dist/cli.mjs','--test','tests/data-and-security.test.ts','tests/reporting-v2.test.ts','tests/reporting-scope.test.ts','tests/retention-launch.test.ts'],{stdio:'inherit'});
if(result.status!==0){process.exitCode=result.status??1;}
else if(process.argv.includes('--hosted')){
 let db;
 try{db=await connectDatabase();await verifyDatabase(db);const schedule=(await db.query("select exists(select 1 from pg_extension where extname='pg_cron') as available")).rows[0];
  if(schedule.available){const job=(await db.query("select jobname,schedule,active from cron.job where jobname='denguewatch-community-retention' and active and schedule='17 * * * *'")).rows;if(job.length!==1)throw Error('Required reporting retention schedule missing.');console.log('PASS: hosted hourly pg_cron schedule exists.');}
  else verifyRetentionWorkflow();
 }catch(error){failClosed(error);}finally{await db?.end();}
}else {
 const flow=spawnSync(process.execPath,['node_modules/@playwright/test/cli.js','test','tests/ui/reporting-flow.spec.ts','--workers=1'],{stdio:'inherit'});
 if(flow.status!==0)process.exitCode=flow.status??1;
 else console.log('PASS: fresh embedded PostgreSQL harness applies all migrations, RLS/abuse/retention tests pass. Hosted Auth, hosted scheduling and Supabase infrastructure are NOT VERIFIED by this harness.');
}
