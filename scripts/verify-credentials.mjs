import { connectDatabase, verifyDatabase, failClosed } from './lib/hosted.mjs';
let db;
try {
 db=await connectDatabase();await db.query('select 1');await verifyDatabase(db);
 const url=process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
 const key=process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url || !key) throw Error('NEEDS OWNER: set server-side SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY).');
 const parsed=new URL(url);if(parsed.username||parsed.password||parsed.protocol!=='https:') throw Error('Invalid database/API configuration.');
 const response=await fetch(new URL('/auth/v1/admin/users?page=1&per_page=1',parsed),{headers:{apikey:key,Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(15000)});
 if(!response.ok) throw Error('NEEDS OWNER: rotated API credential authentication failed.');
 // Do not read or log users or report records.
 await response.body?.cancel();console.log('PASS: rotated database and server Auth API credentials authenticate. No records printed.');
} catch(error){failClosed(error);} finally{await db?.end();}
