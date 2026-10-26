import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {Button,Card,Checkbox,Input,Select} from '../components/ui';
import {useRedesignLanguage} from '../redesign/Language';
import {Guidance} from '../redesign/Guidance';
import {Illustration} from '../overhaul/Identity';
import {Skeleton} from '../overhaul/Components';
import {PrivacyNotice} from '../redesign/PrivacyNotice';
import reportingAreas from '../content/reporting-areas.json';
import {useResource} from '../lib/resources';
import {signalPolicy,scrubNote,submitSignalV3} from '../lib/signals';
import {manilaToday} from '../lib/dates';
async function catalog(signal:AbortSignal){const r=await fetch('/api/v2/barangays.json',{signal});if(!r.ok)throw Error('Area list unavailable');const data=await r.json();if(data.version!==1||!Array.isArray(data.rows))throw Error('Area list unavailable');return data as {rows:{code:string;label:string}[]};}
export function ReportV2(){const {t,fil}=useRedesignLanguage(),policy=useResource('report-policy-v2',signalPolicy),areas=useResource('manila-areas',catalog),open=policy.data?.verified===true&&policy.data.enabled===true;
const [reportType,setReportType]=useState('suspected'),[areaUnit,setAreaUnit]=useState('MANILA CITY'),[affectedRange,setAffectedRange]=useState('1'),[receipt,setReceipt]=useState<Record<string,string|string[]|number|null>|null>(null),[consent,setConsent]=useState(false),[step,setStep]=useState(1),[barangay,setBarangay]=useState(''),[onset,setOnset]=useState(manilaToday()),[symptoms,setSymptoms]=useState<string[]>([]),[note,setNote]=useState(''),[honeypot,setHoneypot]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[code,setCode]=useState(''),[copied,setCopied]=useState(false);
const stepHeading=useRef<HTMLHeadingElement>(null),previousStep=useRef(step),pending=useRef(false),controller=useRef<AbortController|null>(null),swipe=useRef({x:0,y:0}),today=manilaToday(),dateAgo=(days:number)=>new Date(Date.parse(today+'T00:00:00Z')-days*86400000).toISOString().slice(0,10),minimum=dateAgo(90),validDate=onset>=minimum&&onset<=today;
useEffect(()=>{if(previousStep.current!==step)stepHeading.current?.focus();previousStep.current=step;},[step]);useEffect(()=>()=>controller.current?.abort(),[]);
function next(){if(step===2&&open&&!validDate)return;setStep(n=>Math.min(4,n+1));}
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (
      pending.current ||
      !consent ||
      !policy.data?.enabled ||
      !onset ||
      onset > manilaToday()
    )
      return;
    pending.current = true;
    setBusy(true);
    setError("");
    controller.current = new AbortController();
    try {
      const result = await submitSignalV3(
        { barangay, onset, symptoms, note, consent, honeypot,reportType,areaUnit,affectedRange },
        controller.current.signal,
      );
      setCode(result.code);setReceipt(result.stored);
      setNote("");
      setSymptoms([]);
      setBarangay("");
      setOnset("");
      setStep(5);
    } catch (reason) {
      if (!controller.current.signal.aborted)
        setError(
          fil
            ? "Hindi makumpirma kung na-save ang ulat. Huwag itong muling ipadala nang awtomatiko; makipag-ugnayan sa pangkat ng pananaliksik."
            : reason instanceof Error
              ? reason.message
              : t("Report unavailable.", "Hindi maipadala ang ulat."),
        );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="ui-container app-content evidence-page narrow-content">
      <LanguageControl value={language} onChange={setLanguage} />
      <p className="eyebrow">
        {t("COMMUNITY / UNVERIFIED", "KOMUNIDAD / HINDI BERIPIKADO")}
      </p>
      <h1>
        {t("Share an awareness signal.", "Magbahagi ng ulat para sa kaalaman.")}
      </h1><p>{t("Report a suspected case in your household or an unusual cluster you noticed. Choose only a coarse area; no GPS or free-text address is collected. Barangay selection is available only for the verified Manila catalogue; other units stay at province/city level. The onset day may be approximate.","Iulat ang pinaghihinalaang kaso sa pamilya o kakaibang kumpol sa lugar. Pumili lamang ng malawak na lugar; walang GPS o address. May talaan lamang ng barangay para sa Maynila; lalawigan/lungsod lamang ang iba. Maaaring tantiya ang araw ng pagsisimula.")}</p>
      <p>
        {t(
          "We do not ask for your name or contact details, do not store your IP address or precise location, and use no trackers. No system can promise perfect anonymity, so do not include details that identify you or others. Reports never enter official counts, forecasts or the city models.",
          "Hindi hinihingi ang pangalan o contact, hindi iniimbak ang IP address o eksaktong lokasyon, at walang tracker. Walang sistemang makapangangako ng ganap na anonymity; huwag maglagay ng pagkakakilanlan. Hindi kasama ang ulat sa opisyal na bilang, pagtataya o modelo ng lungsod.",
        )}
      </p>
      <Card><p>{t("An IP address, when provided by the trusted hosting proxy, is used transiently to derive a rotating salted rate-limit hash. Raw IPs are never stored. Hashes expire after a 15-minute window and are physically removed on a successful request or the hourly retention job (up to 75 minutes). Automated note filters cannot detect every identifying detail. Retention and consent require DPO review before collection opens.","Kung ibinigay ng hosting proxy ang IP, pansamantala lamang itong ginagamit sa umiikot na salted hash. Hindi iniimbak ang IP. Natatapos ang hash window sa 15 minuto at binubura sa matagumpay na kahilingan o oras-oras na paglilinis (hanggang 75 minuto). Hindi nahuhuli ng filter ang lahat ng pagkakakilanlan. Kailangan ang pagsusuri ng DPO bago buksan ang pagtanggap.")}</p>
        {!policy.data?.enabled && (
          <p className="data-notice" role="status">
            {policy.loading
              ? t(
                  "Checking collection status…",
                  "Sinusuri ang kalagayan ng pagtanggap…",
                )
              : t(
                  "New submissions are closed.",
                  "Hindi pa bukas ang pagtanggap ng bagong ulat.",
                )}
          </p>
        )}
        {!policy.loading && !policy.data?.verified && (
          <p>
            {t(
              "Collection status could not be confirmed; reporting stays closed.",
              "Hindi makumpirma ang pagtanggap; nananatiling sarado ang pag-uulat.",
            )}{" "}
            <Button variant="secondary" onClick={policy.retry}>
              {t("Retry status", "Subukang muli")}
            </Button>
          </p>
        )}
        {step === 1 && (
          <>
            <h2 ref={stepHeading} tabIndex={-1}>
              {t("Understand and consent", "Unawain at pumayag")}
            </h2>
            <p>
              {t(
                "Your optional health report is sensitive personal information. It supports research and coarse community awareness, not diagnosis, emergency response or validated prediction.",
                "Sensitibong personal na impormasyon ang ulat pangkalusugan. Para ito sa pananaliksik at kaalaman ng komunidad, hindi diyagnosis, agarang tugon o napatunayang prediksiyon.",
              )}
            </p>
            <p>
              {t(
                "Only staff can review individual reports. Public counts require staff approval, a 72-hour delay and at least three reports per area/week. Reports are removed after 90 days; withdraw sooner with your private code.",
                "Itinalagang kawani lamang ang makakakita ng indibidwal na ulat. Kailangan ang pag-apruba, 72-oras na paghihintay at hindi bababa sa tatlong ulat sa bawat lugar/linggo. Binubura ang ulat matapos ang 90 araw; maaari kang umatras gamit ang pribadong code.",
              )}
            </p>
            <p>
              {t(
                "Please report only your own household experience or a coarse, non-identifying cluster observation. Do not include anyone’s identity or address.",
                "Sariling karanasan lamang ang iulat. Huwag ilagay ang pagkakakilanlan o tirahan ng sinuman.",
              )}{" "}
              <Link className="text-link" to="/report?drawer=privacy">
                {t("Privacy and withdrawal", "Pagkapribado at pag-urong")}
              </Link>
              .
            </p>
            <Checkbox
              label={t(
                "I voluntarily consent to this research use of my report under community-v2.",
                "Kusang-loob akong pumapayag sa paggamit ng aking ulat sa pananaliksik ayon sa community-v2.",
              )}
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <Button
              disabled={!consent || !policy.data?.enabled}
              onClick={() => setStep(2)}
            >
              {t("Continue to report", "Magpatuloy sa pag-uulat")}
            </Button>
            <p className="muted">
              {t(
                "Controller: DengueWatch student research team. Contact:",
                "Tagapangasiwa: DengueWatch student research team. Makipag-ugnayan sa:",
              )}{" "}
              achilleslang23@gmail.com.{" "}
              {t(
                "Notice requires DPO review before collection opens.",
                "Kailangang suriin ng DPO ang abiso bago buksan ang pagtanggap.",
              )}
            </p>
          </>
        )}
        {step === 2 && (
          <form onSubmit={submit}>
            <h2 ref={stepHeading} tabIndex={-1}>
              {t("Your report", "Iyong ulat")}
            </h2>
            <Select label={t("Report type","Uri ng ulat")} value={reportType} onChange={e=>setReportType(e.target.value)} required><option value="suspected">{t("Suspected household / family case","Pinaghihinalaang kaso sa pamilya")}</option><option value="cluster">{t("Unusual cluster in the area","Di-karaniwang kumpol sa lugar")}</option></Select>
            <Select label={t("Province / city (coarse reporting unit)","Lalawigan / lungsod")} value={areaUnit} onChange={e=>{setAreaUnit(e.target.value);setBarangay("");}} required>{reportingAreas.units.map(name=><option key={name}>{name}</option>)}</Select>
            <Select label={t("People affected (approximate range)","Tinatayang bilang ng apektado")} value={affectedRange} onChange={e=>setAffectedRange(e.target.value)} required>{['1','2-4','5-9','10+'].map(range=><option key={range}>{range}</option>)}</Select>
            <Select
              label={t(
                "Barangay (coarse area only)",
                "Barangay (pangkalahatang lugar lamang)",
              )}
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
              disabled={busy||areaUnit!=="MANILA CITY"}
            >
              <option value="">
                {t(
                  "Manila city · area not listed / prefer not to specify",
                  "Maynila · wala sa listahan / ayaw tukuyin",
                )}
              </option>
              {areas.data?.rows.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </Select>
            {areas.error && (
              <p>
                {t(
                  "Area list unavailable. You may choose Manila city only.",
                  "Hindi makuha ang listahan. Maaaring piliin ang Maynila lamang.",
                )}
              </p>
            )}
            <Input
              label={t(
                "Symptom-onset date (required)",
                "Petsa ng pagsisimula ng sintomas (kailangan)",
              )}
              type="date"
              required
              min={new Date(
                Date.parse(manilaToday() + "T00:00:00Z") - 90 * 86400000,
              )
                .toISOString()
                .slice(0, 10)}
              max={manilaToday()}
              value={onset}
              disabled={busy}
              onChange={(e) => setOnset(e.target.value)}
            />
            <fieldset>
              <legend>
                {t(
                  "Symptoms (optional; not a diagnosis)",
                  "Mga sintomas (opsyonal; hindi diyagnosis)",
                )}
              </legend>
              {[
                ["fever", "Fever", "Lagnat"],
                ["headache", "Headache", "Sakit ng ulo"],
                ["body-ache", "Body ache", "Pananakit ng katawan"],
                ["nausea", "Nausea", "Pagduduwal"],
                ["rash", "Rash", "Pantal"],
                ["other", "Other symptoms", "Iba pang sintomas"],
              ].map(([key, en, fl]) => (
                <Checkbox
                  key={key}
                  label={t(en, fl)}
                  checked={symptoms.includes(key)}
                  disabled={busy}
                  onChange={(e) =>
                    setSymptoms((values) =>
                      e.target.checked
                        ? [...values, key]
                        : values.filter((v) => v !== key),
                    )
                  }
                />
              ))}
            </fieldset>
            <label htmlFor="signal-note">
              {t(
                "Short note (optional, 250 characters)",
                "Maikling tala (opsyonal, 250 titik)",
              )}
            </label>
            <textarea
              id="signal-note"
              maxLength={250}
              value={note}
              disabled={busy}
              onChange={(e) => setNote(e.target.value)}
              aria-describedby="note-scrub"
            />
            <p id="note-scrub" className="muted">
              {t(
                "Email and phone patterns are removed. Address-like notes are discarded. Detection is imperfect: do not include names or identifying details.",
                "Inaalis ang anyong email at telepono. Itinatapon ang talang mukhang tirahan. Hindi perpekto ang pagtukoy: huwag ilagay ang pangalan o pagkakakilanlan.",
              )}
            </p>
            {note && (
              <p>
                {t("Sanitized note:", "Nalinis na tala:")}{" "}
                {scrubNote(note) ||
                  t("Removed for privacy", "Inalis para sa pagkapribado")}
              </p>
            )}
            <div hidden aria-hidden="true">
              <label>
                Website
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </label>
            </div>
            {error && <p role="alert">{error}</p>}
            <Button type="submit" disabled={busy || !policy.data?.enabled}>
              {busy
                ? t(
                    "Checking anti-spam proof…",
                    "Sinusuri ang patunay laban sa spam…",
                  )
                : t("Submit community report", "Ipadala ang ulat")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => setStep(1)}
            >
              {t("Back", "Bumalik")}
            </Button>
          </form>
        )}
        {step === 3 && (
          <>
            <h2 ref={stepHeading} tabIndex={-1}>
              {t(
                "Report received for review",
                "Natanggap ang ulat para sa pagsusuri",
              )}
            </h2>{receipt&&<section aria-label="Exactly what was stored"><h3>{t("Exactly what was stored","Eksaktong naimbak")}</h3><dl>{Object.entries(receipt).map(([key,value])=><div key={key}><dt>{key.replaceAll('_',' ')}</dt><dd>{Array.isArray(value)?value.join(', '):value===null?t('Not supplied','Walang ibinigay'):String(value)}</dd></div>)}</dl></section>}<Guidance compact/>
            <p>
              {t(
                "Unverified. This is not a medical confirmation. Save this private withdrawal code; it cannot be recovered from the app.",
                "Hindi beripikado. Hindi ito kumpirmasyong medikal. Itago ang pribadong code para sa pag-urong; hindi ito makukuha muli sa app.",
              )}
            </p>
            <p className="tracking-code">
              <code>{code}</code>
            </p>
            <Link className="text-link" to="/privacy#withdraw">
              {t("Withdraw with your code", "Umatras gamit ang iyong code")}
            </Link>
          </>
        )}
      </Card>
      <p>
        <Link className="text-link" to="/community">
          {t(
            "View community aggregates",
            "Tingnan ang pinagsamang ulat ng komunidad",
          )}
        </Link>{" "}
        ·{" "}
        <Link className="text-link" to="/prevention">
          {t(
            "Prevention and urgent warning signs",
            "Pag-iwas at agarang babala",
          )}
        </Link>
      </p>
    </div>
  );
}
const headings=[t('What are you reporting?','Ano ang iyong iuulat?'),t('Where and when?','Saan at kailan?'),t('A few details, if you like','Mga detalye, kung nais mo'),t('Review and consent','Suriin at pumayag'),t('Report received for review','Natanggap ang ulat para sa pagsusuri')];
return <div className="report-flow"><p className="eyebrow">{t('COMMUNITY / UNVERIFIED','KOMUNIDAD / HINDI BERIPIKADO')}</p><h1>{t('Share a little awareness.','Magbahagi ng kaalaman.')}</h1><p className="page-intro">{t('A private way to share a household experience or a concern in your area. Reports are separate from official counts.','Pribadong pagbahagi ng karanasan sa pamilya o napansin sa lugar. Hiwalay ang mga ulat sa opisyal na bilang.')}</p>{policy.loading?<Skeleton label={t('Checking collection status…','Sinusuri ang pagtanggap…')}/>:!policy.data?.verified?<section className="report-state banig" role="status"><Illustration kind="closed"/><h2>{t('We cannot confirm collection status.','Hindi makumpirma ang pagtanggap.')}</h2><p>{t('Reporting stays closed while we check. You can try again.','Nananatiling sarado ang pag-uulat habang sinusuri.')}</p><Button variant="secondary" onClick={policy.retry}>{t('Retry status','Subukang muli')}</Button></section>:!open?<section className="report-state banig" role="status"><Illustration kind="closed"/><h2>{t('New submissions are closed.','Sarado ang pagtanggap ng bagong ulat.')}</h2><p>{t('Collection may open after the project’s privacy and launch reviews; no opening date is set. You can preview the steps below.','Maaaring magbukas matapos ang pagsusuri sa pagkapribado at paglulunsad. Wala pang petsa. Tingnan ang mga hakbang sa ibaba.')}</p></section>:null}
{!policy.loading&&policy.data?.verified&&<Card><div className="step-progress" aria-label={t('Report progress','Pag-usad ng ulat')}><ol>{headings.slice(0,4).map((label,i)=><li key={i} aria-current={step===i+1?'step':undefined}><span>{i+1}</span><span className="sr-only">{label}</span></li>)}</ol><span>{step===5?t('Done','Tapos'):t('Step','Hakbang')+' '+step+' / 4'}{!open&&step<5?' · '+t('Read-only preview','Paunang tanaw lamang'):''}</span></div><form onSubmit={submit} onTouchStart={e=>{if((e.target as HTMLElement).closest('input,textarea,select,button,a'))return;swipe.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}} onTouchEnd={e=>{if(busy||step===5||(e.target as HTMLElement).closest('input,textarea,select,button,a'))return;const dx=e.changedTouches[0].clientX-swipe.current.x,dy=e.changedTouches[0].clientY-swipe.current.y;if(Math.abs(dx)>80&&Math.abs(dx)>Math.abs(dy)*2){if(dx<0)next();else setStep(n=>Math.max(1,n-1));}}}><h2 ref={stepHeading} tabIndex={-1}>{headings[step-1]}</h2><div className="step-body" key={step}>
{step===1&&<fieldset disabled={!open||busy} className="report-kind"><legend className="sr-only">{t('Report type','Uri ng ulat')}</legend>{[['suspected',t('Someone in my household','Isang tao sa aking pamilya'),'care'],['cluster',t('A cluster in my area','Kumpol sa aking lugar'),'map']].map(([value,label,kind])=><label key={value} className={reportType===value?'selected':''}><Illustration kind={kind as 'care'|'map'}/><input type="radio" name="report-type" value={value} checked={reportType===value} onChange={()=>setReportType(value)}/><strong>{label}</strong></label>)}</fieldset>}
{step===2&&<fieldset disabled={!open||busy}><legend className="sr-only">{t('Location and onset','Lugar at pagsisimula')}</legend><Select label={t('Province / city (coarse reporting unit)','Lalawigan / lungsod')} value={areaUnit} onChange={e=>{setAreaUnit(e.target.value);setBarangay('');}} required>{reportingAreas.units.map(name=><option key={name}>{name}</option>)}</Select>{areaUnit==='MANILA CITY'&&<Select label={t('Barangay (coarse area only)','Barangay (pangkalahatang lugar lamang)')} value={barangay} onChange={e=>setBarangay(e.target.value)}><option value="">{t('City only / prefer not to specify','Lungsod lamang / ayaw tukuyin')}</option>{areas.data?.rows.map(r=><option key={r.code} value={r.code}>{r.label}</option>)}</Select>}<p>{t('Barangays are offered only for the verified Manila catalogue. No GPS or exact address is collected.','May talaan lamang ng barangay para sa Maynila. Walang GPS o eksaktong address.')}</p>{areaUnit==='MANILA CITY'&&areas.error&&<p>{t('Area list unavailable. You may choose Manila city only.','Hindi makuha ang listahan. Maaaring piliin ang Maynila lamang.')}</p>}<div className="example-weeks">{[[0,t('Today','Ngayon')],[3,t('2–3 days ago','2–3 araw ang nakalipas')],[7,t('Last week','Nakaraang linggo')]].map(([days,label])=><button key={days} type="button" aria-pressed={onset===dateAgo(Number(days))} onClick={()=>setOnset(dateAgo(Number(days)))}>{label}</button>)}</div><Input label={t('Symptom-onset date (required)','Petsa ng pagsisimula ng sintomas (kailangan)')} type="date" required min={minimum} max={today} value={onset} onChange={e=>setOnset(e.target.value)}/>{!validDate&&<p role="alert">{t('Choose a date within the last 90 days, up to today.','Pumili ng petsa sa nakaraang 90 araw, hanggang ngayon.')}</p>}</fieldset>}
{step===3&&<fieldset disabled={!open||busy}><legend>{t('Details are optional','Opsyonal ang mga detalye')}</legend><fieldset className="symptom-chips"><legend>{t('Symptoms (optional; not a diagnosis)','Mga sintomas (opsyonal; hindi diyagnosis)')}</legend>{[['fever','Fever','Lagnat'],['headache','Headache','Sakit ng ulo'],['body-ache','Body ache','Pananakit ng katawan'],['nausea','Nausea','Pagduduwal'],['rash','Rash','Pantal'],['other','Other symptoms','Iba pang sintomas']].map(([key,en,fl])=><Checkbox key={key} label={t(en,fl)} checked={symptoms.includes(key)} onChange={e=>setSymptoms(values=>e.target.checked?[...values,key]:values.filter(v=>v!==key))}/>)}</fieldset><Select label={t('People affected (approximate range)','Tinatayang bilang ng apektado')} value={affectedRange} onChange={e=>setAffectedRange(e.target.value)}>{['1','2-4','5-9','10+'].map(range=><option key={range}>{range}</option>)}</Select><label htmlFor="signal-note">{t('Short note (optional, 250 characters)','Maikling tala (opsyonal, 250 titik)')}</label><textarea id="signal-note" maxLength={250} value={note} onChange={e=>setNote(e.target.value)} aria-describedby="note-scrub note-warning"/><p id="note-scrub">{t('Do not include names, phone numbers, email or addresses. Filters cannot catch everything.','Huwag maglagay ng pangalan, telepono, email o address. Hindi nahuhuli ng filter ang lahat.')}</p><p id="note-warning" role="status">{note&&(scrubNote(note)!==note||/\b(my name|ako si|pangalan|named)\b/i.test(note))?t('This may identify someone. Remove personal details before continuing.','Maaaring makilala ang isang tao. Alisin ang personal na detalye.'):''}</p>{note&&<p>{t('Sanitized note:','Nalinis na tala:')} {scrubNote(note)||t('Removed for privacy','Inalis para sa pagkapribado')}</p>}</fieldset>}
{step===4&&<><dl className="review-summary"><dt>{t('Report type','Uri ng ulat')}</dt><dd>{reportType==='cluster'?t('A cluster in my area','Kumpol sa aking lugar'):t('Someone in my household','Isang tao sa aking pamilya')}</dd><dt>{t('Where and when','Saan at kailan')}</dt><dd>{areaUnit} · {onset}</dd><dt>{t('People affected','Bilang ng apektado')}</dt><dd>{affectedRange}</dd></dl><ul className="consent-summary"><li>{t("We don’t ask your name.",'Hindi namin hinihingi ang iyong pangalan.')}</li><li>{t("We don’t store your IP or exact location.",'Hindi namin iniimbak ang IP o eksaktong lokasyon.')}</li><li>{t('Reports are reviewed before any count is public.','Sinusuri muna ang mga ulat bago ilathala ang bilang.')}</li></ul><p>{t('Your optional health report is sensitive personal information. It supports research and coarse community awareness, not diagnosis, emergency response or validated prediction.','Sensitibong personal na impormasyon ang ulat pangkalusugan. Para ito sa pananaliksik at kaalaman ng komunidad, hindi diyagnosis o agarang tugon.')}</p><p>{t('Only staff can review individual reports. Public counts require approval, a 72-hour delay and at least three reports per area/week. Reports are removed after 90 days; withdraw sooner with your private code.','Kawani lamang ang makakakita ng indibidwal na ulat. Kailangan ang pag-apruba, 72-oras na paghihintay at hindi bababa sa tatlong ulat bawat lugar/linggo. Binubura ang ulat matapos ang 90 araw; gamitin ang code upang bawiin nang mas maaga.')}</p><details className="full-privacy"><summary>{t('Read the full privacy notice','Basahin ang buong abiso sa pagkapribado')}</summary><p>{t('A hosting-proxy IP is used transiently for a rotating salted rate-limit hash. Raw IPs are never stored. Hash windows last 15 minutes; physical deletion occurs on successful requests or hourly retention, up to 75 minutes. No system can promise perfect anonymity. Note filters are imperfect. Retention and consent need DPO review before collection opens.','Pansamantalang ginagamit ang IP sa umiikot na salted hash, hindi iniimbak ang IP. Ang window ay 15 minuto; nililinis sa matagumpay na kahilingan o oras-oras, hanggang 75 minuto. Hindi perpekto ang anonymity at filter. Kailangan ang pagsusuri ng DPO bago magbukas.')}</p><Link to="/report?drawer=privacy">{t('Full notice, privacy limits and withdrawal','Buong abiso, limitasyon at pagbawi')}</Link></details><Checkbox label={t('I voluntarily consent to this research use of my report under community-v2.','Kusang-loob akong pumapayag sa paggamit ng aking ulat sa pananaliksik ayon sa community-v2.')} checked={consent} disabled={!open||busy} onChange={e=>setConsent(e.target.checked)}/><p className="muted">{t('A verified project contact and DPO review are required before collection opens.','Kailangan ang beripikadong contact at pagsusuri ng DPO bago magbukas.')}</p></>}
{step===5&&<><div className="report-success"><Illustration kind="done"/></div><p>{t('Save this private withdrawal code. It cannot be recovered from the app.','Itago ang pribadong code para sa pagbawi. Hindi ito makukuha muli sa app.')}</p><p className="tracking-code"><code>{code}</code></p><Button type="button" variant="secondary" onClick={()=>{void navigator.clipboard.writeText(code).then(()=>setCopied(true)).catch(()=>setError(t('Copy unavailable. Select and save the code manually.','Hindi makopya. Piliin at itago ang code.')));}}>{copied?t('Copied','Nakopya'):t('Copy code','Kopyahin ang code')}</Button><ol className="next-timeline"><li>{t('Received privately','Pribadong natanggap')}</li><li>{t('Staff review — not medical confirmation','Pagsusuri ng kawani — hindi medikal na kumpirmasyon')}</li><li>{t('Only approved groups can become public after the privacy threshold and delay.','Aprubadong grupo lamang ang mailalathala matapos ang pamantayan at paghihintay.')}</li></ol>{receipt&&<details><summary>{t('Exactly what was stored','Eksaktong naimbak')}</summary><dl>{Object.entries(receipt).map(([key,value])=><div key={key}><dt>{key.replaceAll('_',' ')}</dt><dd>{Array.isArray(value)?value.join(', '):value===null?t('Not supplied','Walang ibinigay'):String(value)}</dd></div>)}</dl></details>}<Guidance compact/><Link to="/report?drawer=privacy#withdraw">{t('Withdraw with your code','Bawiin gamit ang iyong code')}</Link></>}
</div><div hidden aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={e=>setHoneypot(e.target.value)}/></label></div>{error&&<p role="alert">{error}</p>}{step<5&&<div className="step-buttons">{step>1&&<Button type="button" variant="secondary" disabled={busy} onClick={()=>setStep(n=>Math.max(1,n-1))}>{t('Back','Bumalik')}</Button>}{step<4?<Button type="button" disabled={busy||(step===2&&open&&!validDate)} onClick={next}>{t('Continue','Magpatuloy')} →</Button>:<Button type="submit" disabled={!open||!consent||!validDate||busy}>{busy?t('Checking anti-spam proof…','Sinusuri ang patunay laban sa spam…'):t('Submit community report','Ipadala ang ulat')}</Button>}</div>}</form></Card>}
<details className="report-withdraw"><summary>{t('Already have a code? Withdraw a report','May code ka na? Bawiin ang ulat')}</summary><PrivacyNotice/></details><a href="/#actions">{t('Prevention and urgent warning signs','Pag-iwas at agarang babala')}</a></div>;}
