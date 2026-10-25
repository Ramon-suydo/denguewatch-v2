import { useEffect,useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { Button,Card,Input } from './ui';
export function StaffMfa({onVerified,onCancel}:{onVerified:()=>Promise<void>;onCancel:()=>void}){
 const [factor,setFactor]=useState(''),[qr,setQr]=useState(''),[code,setCode]=useState(''),[ready,setReady]=useState(false),[busy,setBusy]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let live=true;void(async()=>{try{
  const client=getSupabase();const aal=await client.auth.mfa.getAuthenticatorAssuranceLevel();if(aal.error)throw Error();
  if(aal.data.currentLevel==='aal2'){if(live)await onVerified();return;}
  const factors=await client.auth.mfa.listFactors();if(factors.error)throw Error();if(live){setFactor(factors.data.totp.find(f=>f.status==='verified')?.id??'');setReady(true);setBusy(false);}
 }catch{if(live){setError('Staff verification could not complete. Sign out and try again.');setBusy(false);}}})();return()=>{live=false;};},[]);
 async function enroll(){if(busy)return;setBusy(true);setError('');try{const result=await getSupabase().auth.mfa.enroll({factorType:'totp',friendlyName:'Staff authenticator'});if(result.error)throw Error();setFactor(result.data.id);setQr(result.data.totp.qr_code);}catch{setError('Authenticator enrollment failed. No access granted.');}finally{setBusy(false);}}
 async function verify(event:React.FormEvent){event.preventDefault();if(busy)return;setBusy(true);setError('');try{const result=await getSupabase().auth.mfa.challengeAndVerify({factorId:factor,code});setCode('');if(result.error)throw Error();await onVerified();setQr('');}catch{setError('Verification failed. Check the authenticator code and appointed staff role.');}finally{setBusy(false);}}
 return <Card><h2>Verify staff authenticator</h2><p>Staff access requires an appointed role and a verified second factor.</p>{error&&<p role="alert">{error}</p>}{qr&&<><p>Scan privately in your authenticator. Do not share or screenshot this enrollment code.</p><img src={qr} alt="Private authenticator enrollment QR code" /></>}{ready&&(!factor?<Button disabled={busy} onClick={enroll}>Enroll authenticator</Button>:<form onSubmit={verify}><Input label="Authenticator code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" required value={code} onChange={e=>setCode(e.target.value)} /><Button type="submit" disabled={busy}>Verify authenticator</Button></form>)}<Button variant="secondary" disabled={busy} onClick={onCancel}>Cancel staff sign in</Button></Card>;
}
