import {useRef,useState} from "react";

import {useSearchParams} from "react-router-dom";

import type {AreaMap,BarangayArea} from "../lib/area-map";

import {useBarangayCases} from "../lib/area-map";

import {mapColor,mapRamp} from "../lib/map-colors.js";

import {mapSourceMetadata} from "../lib/source-metadata";

import {Button,Input} from "./ui";

type Layer="population"|"density"|"cases";

const number=(value:number|null,digits=0)=>value===null?"Not available":value.toLocaleString("en-PH",{maximumFractionDigits:digits});

export function TondoMap({data}:{data:AreaMap}){

 const [params,setParams]=useSearchParams(),[search,setSearch]=useState(""),[view,setView]=useState("Areas"),[layer,setLayer]=useState<Layer>("population"),[district,setDistrict]=useState("All"),[sort,setSort]=useState("number"),[pins,setPins]=useState<number[]>([]),[zoom,setZoom]=useState(1),[pan,setPan]=useState({x:0,y:0});

 const drag=useRef<{x:number;y:number;pan:{x:number;y:number};moved:boolean}|null>(null),svg=useRef<SVGSVGElement>(null);

 const cases=useBarangayCases(),locked=layer==="cases"&&!cases.available;

 const value=(row:BarangayArea)=>layer==="population"?row.population:layer==="density"?row.density:row.psgc?cases.byPsgc.get(row.psgc)?.reported?cases.byPsgc.get(row.psgc)!.rollingFourWeeks:null:null;

 const filtered=data.rows.filter(row=>(district==="All"||row.district===district)&&(!search||(`Barangay ${row.number}`).toLowerCase().includes(search.toLowerCase().trim())));

 const shown=[...filtered].sort((a,b)=>sort==="number"?a.number-b.number:(value(b)??-Infinity)-(value(a)??-Infinity)||a.number-b.number);

 const values=filtered.map(value).filter((v):v is number=>v!==null),min=values.length?Math.min(...values):0,max=values.length?Math.max(...values):0;

 const selected=data.rows.find(row=>row.number===Number(params.get("b"))),pick=(row:BarangayArea)=>setParams({area:"tondo",b:String(row.number)},{replace:true});

 const rank=(row:BarangayArea)=>value(row)===null?null:[...data.rows].filter(r=>value(r)!==null).sort((a,b)=>value(b)!-value(a)!||a.number-b.number).findIndex(r=>r.number===row.number)+1;

 const paths=filtered.filter(row=>row.path),highest=values.length?filtered.find(row=>value(row)===max):null;

 return <section aria-label="Tondo barangay map" className="tondo-map">

  <div className="map-toolbar"><Input label="Search barangay" type="search" placeholder="Barangay 202" value={search} onChange={event=>setSearch(event.target.value)}/>

   <div className="map-segments" role="group" aria-label="Map view">{["Areas","Heat","Table"].map(name=><Button key={name} variant={view===name?"primary":"ghost"} aria-pressed={view===name} onClick={()=>setView(name)}>{name}</Button>)}</div>

   <div className="map-segments" role="group" aria-label="Map layer">{([['population','Population'],['density','Crowding'],['cases','Dengue cases · locked']] as const).map(([key,label])=><Button key={key} variant={layer===key?"primary":"ghost"} aria-pressed={layer===key} onClick={()=>setLayer(key)}>{label}</Button>)}</div>

  </div>

  <p className="map-takeaway">{locked?cases.reason:highest?`Barangay ${highest.number} has the highest ${layer==="population"?"recorded population":"mapped crowding"} among the ${values.length} displayed barangays with values.`:"No source values match these filters."}</p>

  <details className="map-coverage"><summary>{data.metadata.mapped} of {data.metadata.requested} mapped</summary><div className="map-drawer"><h2>Coverage and sources</h2><p>{data.metadata.mapped} requested barangay numbers have map boundaries. Missing polygons cannot be placed on the map.</p><ul>{data.rows.filter(row=>!row.path).map(row=><li key={row.number} className="missing-boundary">Barangay {row.number}: no boundary data; population not available.</li>)}</ul><p>{data.metadata.populationKnownRows} population entries sum to {number(data.metadata.populationKnownTotal)}. The PSA’s published Tondo total is {number(data.metadata.publishedPopulation)}: {number(data.metadata.populationDiscrepancy)} people are recorded separately in Barangay 202-A, which reconciles that total. Its boundary is quarantined because the repository assigns it Barangay 202’s PSGC code; no guessed join is used.</p><p>Requested numbers 1–267 are a mapping scope, not a verified count of current administrative units. 202-A’s separate entry stays outside this map pending code review.</p><p>2020 population and newer boundaries may not describe the same historical geography. Source PSGC codes are retained, not inferred from barangay numbers.</p><div className="district-chips" role="group" aria-label="District filter">{['All','Tondo I West','Tondo II East'].map(name=><Button key={name} variant={district===name?'primary':'ghost'} aria-pressed={district===name} onClick={()=>setDistrict(name)}>{name}</Button>)}</div>{Object.values(mapSourceMetadata).map(source=><p key={source.title}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> · {source.issuingOffice} · {source.usageTerms}</p>)}</div></details>

  <div className="map-legend"><span>{locked?"No reported data":values.length?number(min):"No data"}</span><span className="map-ramp" style={{background:`linear-gradient(90deg in srgb-linear,${mapRamp.join(',')})`}}/><span>{locked?"Locked":values.length?number(max):"Unavailable"}</span><span className="legend-no-data">▨ No data</span></div>

  <p className="map-context">{layer==="density"?"People per km² · crowding, not disease risk.":layer==="population"?"People · PSA 2020 census.":"Barangay counts stay separate from Manila city counts."} {view==="Heat"?"Smoothed view. Boundaries show where the data applies. Color intensity shows overlapping weighted kernels, not an exact count at a location.":""}</p>

  {view==='Table'?<div className="map-table table-scroll" role="region" aria-label="Barangay table" tabIndex={0}><table><caption>Requested Tondo barangay numbers; unavailable values stay unavailable.</caption><thead><tr><th><button onClick={()=>setSort('number')}>Barangay ↕</button></th><th>District</th><th><button onClick={()=>setSort('value')}>Selected value ↓</button></th><th>Population</th><th>Area km²</th><th>Boundary</th></tr></thead><tbody>{shown.map(row=><tr key={row.number}><th><button onClick={()=>pick(row)}>Barangay {row.number}</button></th><td>{row.district}</td><td>{locked?'Not reported':number(value(row),layer==='density'?1:0)}</td><td>{number(row.population)}</td><td>{number(row.area,3)}</td><td>{row.path?'Mapped':'▨ No boundary data'}</td></tr>)}</tbody></table></div>:<>

   <div className="map-zoom" role="group" aria-label="Map zoom"><Button variant="ghost" aria-label="Zoom in" onClick={()=>setZoom(z=>Math.min(4,z+.25))}>+</Button><Button variant="ghost" aria-label="Zoom out" onClick={()=>setZoom(z=>Math.max(1,z-.25))}>−</Button><Button variant="ghost" onClick={()=>{setZoom(1);setPan({x:0,y:0});}}>Reset</Button></div>

   <svg ref={svg} className="barangay-svg" viewBox="0 0 900 680" role="group" aria-label="Tondo map; arrow keys focus barangays, plus and minus zoom, zero resets" onKeyDown={event=>{if(event.key==='+'||event.key==='='){setZoom(z=>Math.min(4,z+.25));event.preventDefault();}if(event.key==='-'){setZoom(z=>Math.max(1,z-.25));event.preventDefault();}if(event.key==='0'){setZoom(1);setPan({x:0,y:0});}if(event.key.startsWith('Arrow')){const index=paths.findIndex(row=>row.number===selected?.number),next=paths[(index+(event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:1)+paths.length)%paths.length];if(next){pick(next);svg.current?.querySelector<SVGPathElement>(`[data-barangay="${next.number}"]`)?.focus();}event.preventDefault();}}}

    onPointerDown={event=>{if(event.pointerType==='mouse'){drag.current={x:event.clientX,y:event.clientY,pan,moved:false};event.currentTarget.setPointerCapture(event.pointerId);}}} onPointerMove={event=>{if(drag.current){const ratio=900/event.currentTarget.getBoundingClientRect().width;drag.current.moved=Math.abs(event.clientX-drag.current.x)+Math.abs(event.clientY-drag.current.y)>5;setPan({x:drag.current.pan.x+(event.clientX-drag.current.x)*ratio,y:drag.current.pan.y+(event.clientY-drag.current.y)*ratio});}}} onPointerUp={()=>{drag.current=null;}}>

    <defs><pattern id="no-data" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#16255a"/><path d="M0 8L8 0" stroke="#8192bf" strokeWidth="1"/></pattern><clipPath id="tondo-outline">{data.rows.filter(row=>row.path).map(row=><path key={row.number} d={row.path!}/>)}</clipPath><filter id="heat-blur" x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="12"/></filter></defs>

    <g transform={`translate(${pan.x} ${pan.y}) translate(450 340) scale(${zoom}) translate(-450 -340)`}>

     {view==='Heat'&&!locked&&<g clipPath="url(#tondo-outline)"><g filter="url(#heat-blur)">{paths.filter(row=>value(row)!==null&&value(row)!>0).map(row=><circle key={row.number} cx={row.centroid![0]} cy={row.centroid![1]} r="32" opacity={max?value(row)!/max:0} fill={mapColor(value(row),min,max)}/>)}</g></g>}

     {paths.map(row=><path key={row.number} d={row.path!} data-barangay={row.number} tabIndex={row.number===(selected?.number??paths[0]?.number)?0:-1} role="button" aria-label={`Barangay ${row.number}, ${locked?'not reported':number(value(row))}, ${row.district}`} onFocus={()=>pick(row)} onMouseEnter={()=>{if(!drag.current)pick(row);}} onClick={()=>pick(row)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){pick(row);event.preventDefault();}}} fill={locked||value(row)===null?'url(#no-data)':view==='Heat'?'transparent':mapColor(value(row),min,max)} stroke={row.number===selected?.number?'#fff':'#2dd4dc'} strokeOpacity={row.number===selected?.number?1:.8} strokeWidth={row.number===selected?.number?2:.6} strokeDasharray={layer==="cases"&&row.psgc&&cases.byPsgc.get(row.psgc)?.unstable?"3 2":undefined} vectorEffect="non-scaling-stroke"><title>Barangay {row.number}: {locked?'Not reported':number(value(row))}</title></path>)}

    </g>

   </svg>{locked&&<p className="map-locked" role="status">🔒 {cases.reason}</p>}

  </>}

  {selected&&<aside className="barangay-info" aria-label={`Barangay ${selected.number} information`}><h2>Barangay {selected.number}</h2><p>{selected.district}</p><dl><dt>Population (2020)</dt><dd>{number(selected.population)}</dd><dt>Area km²</dt><dd>{number(selected.area,3)}</dd><dt>Crowding, people/km²</dt><dd>{number(selected.density,1)} · not disease risk</dd><dt>Rank by selected layer</dt><dd>{locked?'Unavailable':rank(selected)??'Unavailable'}</dd><dt>Small-number status</dt><dd>{layer==="cases"&&selected.psgc&&cases.byPsgc.get(selected.psgc)?.unstable?"Unstable small number":layer==="cases"?"No reviewed cases source":"Not a disease measure"}</dd><dt>PSGC</dt><dd>{selected.psgc??'Not established by source'}</dd></dl><Button variant="secondary" onClick={()=>setPins(previous=>previous.includes(selected.number)?previous.filter(n=>n!==selected.number):[...previous.slice(-1),selected.number])}>{pins.includes(selected.number)?'Unpin':'Pin to compare'}</Button><button aria-label="Close barangay information" onClick={()=>setParams({area:'tondo'},{replace:true})}>Close</button>{pins.length>0&&<div className="map-comparison" aria-label="Pinned comparison">{pins.map(n=>{const row=data.rows.find(r=>r.number===n)!;return <p key={n}>Barangay {n}: {locked?'Not reported':number(value(row))}</p>;})}</div>}</aside>}

 </section>;

}

