import type { DemoSnapshot } from "./demo-snapshot";
export function dataConfidence(snapshot: DemoSnapshot) {
 const city = snapshot.cities.find(city => city.name === "MANILA CITY");
 const rows = snapshot.history.filter(row => row.lgu_id === city?.id);
 const sources = [...new Set(rows.map(row => row.source))].map(source => {
  const series = rows.filter(row => row.source === source).sort((a,b) => a.period_start.localeCompare(b.period_start));
  return {source, period: series[0].period_type, rows: series, first: series[0].period_start, last: series.at(-1)!.period_start};
 });
 const latest = rows.map(row => row.period_start).sort().at(-1);
 const verification = !!snapshot.metadata.verified && rows.every(row => snapshot.metadata.sourceChecksums.some(source => source.source === row.source && source.sha256 === row.source_sha256));
 const weekly = rows.filter(row => row.period_type === "week"), daily = rows.filter(row => row.period_type === "day");
 const overlaps = [...new Set(daily.map(row => row.period_start.slice(0,4)))].filter(year => weekly.some(row => row.period_start.startsWith(year+"-12"))).map(year => ({year, day: daily.filter(row => row.period_start.startsWith(year)).reduce((n,r)=>n+r.cases,0), week: weekly.filter(row => row.period_start.startsWith(year)).reduce((n,r)=>n+r.cases,0)}));
 return {rows, sources, latest, verification, overlaps, firstYear: rows.map(row=>row.period_start.slice(0,4)).sort()[0], lastYear: latest?.slice(0,4)};
}
export function coverageSegments(dates: string[], step: number) {
 if (!dates.length) return [];
 const present = new Set(dates); const segments: {date:string; end:string; reported:boolean}[]=[];
 for(let time=Date.parse(dates[0]), end=Date.parse(dates.at(-1)!);time<=end;time+=step*86400000){
  const date=new Date(time).toISOString().slice(0,10), next=new Date(time+step*86400000).toISOString().slice(0,10); const reported=present.has(date), last=segments.at(-1);
  if(last?.reported===reported) last.end=next; else segments.push({date,end:next,reported});
 }
 return segments;
}
