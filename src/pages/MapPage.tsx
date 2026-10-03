import {lazy,Suspense} from "react";
import {PageHeader} from "../components/PageHeader";
import {useResource} from "../lib/resources";
import {loadAreaMap} from "../lib/area-map";
import {ReadState} from "../components/PageState";
const TondoMap=lazy(()=>import("../components/TondoMap").then(module=>({default:module.TondoMap})));
export function MapPage(){const area=useResource("tondo-geometry",loadAreaMap);return <><PageHeader eyebrow="TONDO, MADE VISIBLE" title="Explore Tondo." description="People and places, shown with historical census data. Crowding is not disease risk."/><div className="ui-container app-content"><ReadState resource={area}>{data=><Suspense fallback={<div className="tondo-map map-loading" role="status">Loading the Tondo map…</div>}><TondoMap data={data}/></Suspense>}</ReadState></div></>;}
