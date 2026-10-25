import { applyPendingMigrations } from './lib/migrations.mjs';
import { connectDatabase,verifyDatabase,failClosed } from './lib/hosted.mjs';
let db;
try {
 db=await connectDatabase();await db.query('begin');await db.query('select pg_advisory_xact_lock(25102026)');
 await applyPendingMigrations(db);
 await verifyDatabase(db);
 // Missing launch verification never opens collection. A one-line kill switch remains available.
 const requested=process.env.REPORTING_ENABLED!=='false';
 if(process.argv.includes('--reporting-off')) {await db.query('update public.reporting_v2_policy set enabled=false where id');console.log('Reporting disabled.');}
 else if(process.argv.includes('--enable-reporting')){
  if(process.env.LAUNCH_GATES_PASSED!=='1') throw Error('NEEDS OWNER: all launch gates must pass before enabling collection.');
  await db.query('update public.reporting_v2_policy set enabled=$1 where id',[requested]);console.log('Verified reporting enabled: '+requested);
 }
 await db.query('commit');console.log('Bootstrap committed. No official data or reports seeded.');
} catch(error){try{await db?.query('rollback');}catch{}failClosed(error);}finally{await db?.end();}
