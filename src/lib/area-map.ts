import {loadDemoSnapshot,isSnapshotMode} from "./demo-snapshot";
export interface BarangayArea {number:number;psgc:string|null;district:string;population:number|null;area:number|null;density:number|null;path:string|null;centroid:[number,number]|null}
export interface AreaMap {metadata:{area:string;name:string;width:number;height:number;requested:number;mapped:number;populationKnownRows:number;populationKnownTotal:number;publishedPopulation:number;populationDiscrepancy:number;populationYear:number;quarantined:{name:string;population:number;reason:string}[]};rows:BarangayArea[]}
export async function loadAreaMap(signal:AbortSignal):Promise<AreaMap>{
 if(isSnapshotMode()){const snapshot=await loadDemoSnapshot();if(snapshot.areas?.tondo)return snapshot.areas.tondo as AreaMap;}
 try{const response=await fetch(`${import.meta.env?.BASE_URL??"/"}geo/tondo.json`,{signal});if(!response.ok)throw Error();const data=await response.json();if(data.metadata?.area!=="tondo"||!data.rows?.length)throw Error();return data;}
 catch(error){if(signal.aborted)throw error;const snapshot=await loadDemoSnapshot();const area=snapshot.areas?.tondo;if(!area)throw Error("The verified Tondo map file could not load. Try the prepared offline package.");return area as AreaMap;}
}
// Phase 4 has no reviewed aggregated source yet. City counts never unlock this gate.
export function useBarangayCases(){return {available:false,reason:"Waiting for barangay-level data from the Manila Health Department",byPsgc:new Map<string,{rollingFourWeeks:number|null;reported:boolean;unstable:boolean}>()};}
