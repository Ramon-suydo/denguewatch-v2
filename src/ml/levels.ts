export function level(probability:number|null,bands:number[]){return probability===null?null:bands.filter(cut=>probability>=cut).length;}
export const TRAFFIC_COLORS=['#edf3dc','#b8d3cd','#426e88','#45355e'] as const;
export function probabilityColor(probability:number|null,bands:number[]){return probability===null?'#aebbc4':TRAFFIC_COLORS[level(probability,bands)!];}
