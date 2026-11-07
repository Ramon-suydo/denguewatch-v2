import {useState} from 'react';
import {Segmented} from '../overhaul/Components';
import {ManilaHistory} from '../redesign/ManilaHistory';
import {useRedesignLanguage} from '../redesign/Language';
import type {useForecast} from '../ml/useForecast';
import {LiveManilaCard} from './LiveManilaCard';
import {ReadingGuide} from './ForecastExtras';
// Manila opens on this week's forecast. The NCR section keeps its own Replay mode (no 2026 data for other cities).
export function ManilaMode({forecast}:{forecast:ReturnType<typeof useForecast>}){const {t}=useRedesignLanguage(),[mode,setMode]=useState<'Replay'|'Live'>('Live'),data=forecast.liveManila,active=mode==='Live'&&Boolean(forecast.live)&&Boolean(data);
 return <section aria-label={t('Manila forecast','Pagtataya sa Maynila')} className="manila-mode"><Segmented value={active?'Live':'Replay'} onChange={value=>setMode(value as 'Replay'|'Live')} label={t('Manila: this week or past records','Maynila: ngayong linggo o lumang tala')} options={[{value:'Live',label:t('This week','Ngayong linggo'),disabled:!forecast.live},{value:'Replay',label:t('Past records (2023)','Lumang tala (2023)')}]}/>{forecast.stale&&<p role="status">{t('The latest Manila figures are more than two weeks old, so past records are shown. Admins: add the newest Monday total from the Manila PIO report to bring the forecast back.','Lampas dalawang linggo na ang huling tala ng Maynila kaya lumang tala ang ipinapakita. Admin: idagdag ang pinakabagong bilang tuwing Lunes mula sa ulat ng Manila PIO para bumalik ang pagtataya.')}</p>}{forecast.liveError&&<p role="status">{t('This week\'s figures could not load. Past records are shown instead.','Hindi ma-load ang tala ngayong linggo. Lumang tala ang ipinapakita.')} <button onClick={forecast.retry}>{t('Try again','Subukan muli')}</button></p>}{active&&data?<div id="manila-history" className="fade-in"><ReadingGuide/><LiveManilaCard data={data}/></div>:<div className="fade-in"><ManilaHistory/></div>}</section>;
}
