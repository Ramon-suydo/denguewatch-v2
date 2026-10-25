import { createClient } from '@supabase/supabase-js';
import { connectDatabase, failClosed } from './lib/hosted.mjs';
let db;
try{
 const email=process.env.BOOTSTRAP_ADMIN_EMAIL,password=process.env.BOOTSTRAP_ADMIN_PASSWORD;
 if(!email || !password || password.length<16) throw Error('NEEDS OWNER: set BOOTSTRAP_ADMIN_EMAIL and a unique BOOTSTRAP_ADMIN_PASSWORD of at least 16 characters.');
 db=await connectDatabase();
 const url=process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url || !key) throw Error('NEEDS OWNER: server Supabase API configuration is missing.');
 const api=new URL(url);if(api.protocol!=='https:' || api.username || api.password)throw Error('Invalid database/API configuration.');
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 // Look up the requested user only. Never list users in console output.
 let user=(await db.query('select id from auth.users where lower(email)=lower($1)',[email])).rows[0];
 if(!user){
  const result=await client.auth.admin.createUser({email,password,email_confirm:true});
  if(result.error || !result.data.user) throw Error('Admin creation failed.');user=result.data.user;console.log('Created the requested Auth user.');
 }else console.log('Requested Auth user already exists; password unchanged.');
 await db.query("insert into private.staff_roles(user_id,role) values($1,'admin') on conflict(user_id) do update set role='admin'",[user.id]);
 console.log('Admin appointment confirmed. NEEDS OWNER: enroll MFA and verify a hosted sign-in before launch.');
}catch(error){failClosed(error);}finally{await db?.end();}
