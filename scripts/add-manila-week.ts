// Add one weekly Manila total from the Manila PIO "Daily Reporting W.I.L.D. Diseases" post.
//   npm run live:add-week -- --total 4480 --report 2026-11-02 --url <link to the Manila PIO post>
// Optional: --estimated --note "why it is estimated"
// Uses the same validation as the admin upload (appendWeek): Monday report date, whole numbers,
// non-decreasing totals, public Facebook post URL. Afterwards re-run the Random Forest
// (npm run count:evaluate && npm run count:extras) so next week's forecast and alert refresh.
import {readFile,writeFile,access} from 'node:fs/promises';
import {appendWeek,buildLive,type LiveRow,type HistoricalWeek} from '../src/live-manila/model.ts';

const args=process.argv.slice(2),get=(name:string)=>{const i=args.indexOf('--'+name);return i>=0?args[i+1]:undefined;};
const total=Number(get('total')),report=get('report')??'',url=get('url')??'',estimated=args.includes('--estimated'),note=get('note')??'';
if(!Number.isSafeInteger(total)||total<0)throw Error('Use --total with the "total cases since Jan 1" number, e.g. --total 4480');
if(!/^\d{4}-\d{2}-\d{2}$/.test(report))throw Error('Use --report with the Monday report date, e.g. --report 2026-11-02');

const shipped=JSON.parse(await readFile('public/live-manila/weekly.json','utf8')) as {rows:LiveRow[]};
const processed=JSON.parse(await readFile('data/processed/manila_live_weekly.json','utf8')) as {rows:LiveRow[];input_sha256?:string};
const history=JSON.parse(await readFile('data/processed/manila_weekly.json','utf8')) as {scenarios:{M:HistoricalWeek[]}};
const rows=appendWeek(processed.rows.map(r=>({...r,evidence_file:r.evidence_file??null})),{total,report,url,estimated,note});
const added=rows.at(-1)!;
const output={...buildLive(rows,history.scenarios.M),input_sha256:processed.input_sha256};
await writeFile('data/processed/manila_live_weekly.json',JSON.stringify(output,null,2)+'\n');
await writeFile('public/live-manila/weekly.json',JSON.stringify({...output,rows:output.rows.map(({evidence_file:_private,...row})=>row)},null,2)+'\n');
// Fill the reported number into the forecast track record (forecasts were saved before this week was known).
const logPath='data/processed/expanded-manila/forecast-log.json';
if(await access(logPath).then(()=>true,()=>false)){
 const log=JSON.parse(await readFile(logPath,'utf8')) as {entries:{target_week_end:string;actual:number|null}[]};
 const entry=log.entries.find(e=>e.target_week_end===added.week_end);
 if(entry&&entry.actual===null){entry.actual=added.weekly_new_cases;const text=JSON.stringify(log,null,2)+'\n';await writeFile(logPath,text);await writeFile('public/research/manila-forecast-log.json',text);console.log(`Track record: forecast for ${added.week_end} now compared with ${added.weekly_new_cases} reported cases.`);}
}
console.log(`Added week ${added.week_start} to ${added.week_end}: ${added.weekly_new_cases} cases (total ${added.total_since_jan1}). Rows: ${shipped.rows.length} -> ${rows.length}.`);
console.log('Next: ask the model owner to re-run npm run count:evaluate && npm run count:extras to refresh the Random Forest forecast.');
