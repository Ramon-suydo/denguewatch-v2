import { execFileSync } from 'node:child_process';
const run=(command,args)=>execFileSync(command,args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
export function verifyRetentionWorkflow(){
 try{
  const remote=run('git',['remote','get-url','origin']),match=remote.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if(!match)throw Error();const repository=match[1]+'/'+match[2];
  const api=path=>JSON.parse(run('gh',['api','repos/'+repository+'/'+path]));
  const workflow=api('actions/workflows/retention.yml');if(workflow.state!=='active')throw Error();
  const file=api('contents/.github/workflows/retention.yml');
  if(file.sha!==run('git',['hash-object','.github/workflows/retention.yml']))throw Error();
  const content=Buffer.from(file.content,'base64').toString('utf8');if(!content.includes("17 * * * *")||!content.includes('scripts/purge-retention.mjs'))throw Error();
  const runs=api('actions/workflows/retention.yml/runs?per_page=100').workflow_runs;
  const success=runs.find(r=>r.status==='completed'&&r.conclusion==='success'&&['schedule','workflow_dispatch'].includes(r.event)&&Date.now()-Date.parse(r.updated_at)<48*3600000);
  if(!success)throw Error();
  if(api('contents/scripts/purge-retention.mjs?ref='+success.head_sha).sha!==run('git',['hash-object','scripts/purge-retention.mjs']))throw Error();
  const target=api('actions/variables/SUPABASE_URL').value;
  if(new URL(target).origin!==new URL(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL).origin)throw Error();
  console.log('PASS: exact hourly retention workflow is active, current protected-RPC script ran successfully within 48 hours, and repository target matches local API configuration.');
 }catch{throw Error('NEEDS OWNER: configure the hourly retention workflow and matching target, run it successfully, then authenticate gh and rerun db:verify -- --hosted. No successful schedule claimed.');}
}
