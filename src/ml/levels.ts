export function level(probability:number|null,bands:number[]){return probability===null?null:bands.filter(cut=>probability>=cut).length;}
export const TRAFFIC_COLORS=['#187947','#e0b800','#df7700','#bc2531'] as const;
export function probabilityColor(probability:number|null,bands:number[]){return probability===null?'#aebbc4':TRAFFIC_COLORS[level(probability,bands)!];}
