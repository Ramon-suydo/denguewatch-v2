export type Tree={left:number[];right:number[];feature:number[];threshold:number[];probability:number[]};
export type Model={kind:string;trees:Tree[];calibration:[number,number];operating_point:number;prior:number};
export type ModelBundle={version:string;feature_spec:string[];chosen:string;bands:number[];models:Record<string,Model>;source_sha256:string};
export function score(bundle:ModelBundle,features:number[],modelName=bundle.chosen,seasonalRaw?:number){
 if(features.length!==bundle.feature_spec.length||features.some(v=>!Number.isFinite(v)))throw Error('Complete finite features are required.');
 const model=bundle.models[modelName];if(!model)throw Error('Unknown model.');
 let raw:number;
 if(model.kind==='majority')raw=model.prior;
 else if(model.kind==='persistence')raw=features[7]/(1+features[7]);
 else if(model.kind==='seasonal'){if(seasonalRaw===undefined||!Number.isFinite(seasonalRaw))throw Error('Seasonal history is required.');raw=seasonalRaw;}
 else{if(!model.trees.length)throw Error('Tree data unavailable.');raw=model.trees.reduce((sum,t)=>{let node=0,steps=0;while(t.left[node]!==-1){if(++steps>t.left.length)throw Error('Invalid model tree.');node=Math.fround(features[t.feature[node]])<=t.threshold[node]?t.left[node]:t.right[node];}return sum+t.probability[node];},0)/model.trees.length;}
 const z=Math.max(-700,Math.min(700,model.calibration[0]*raw+model.calibration[1]));const probability=1/(1+Math.exp(-z));
 return {raw,probability,class:Number(model.kind==='majority'?raw>=.5:model.kind==='persistence'||model.kind==='seasonal'?raw>.5:probability>=model.operating_point)};
}
export function level(probability:number|null,bands:number[]){return probability===null?null:bands.filter(cut=>probability>=cut).length;}
export const TRAFFIC_COLORS=['#187947','#e0b800','#df7700','#bc2531'] as const;
export function probabilityColor(probability:number|null,bands:number[]){return probability===null?'#aebbc4':TRAFFIC_COLORS[level(probability,bands)!];}
