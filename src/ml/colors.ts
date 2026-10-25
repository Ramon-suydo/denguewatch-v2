import type {ExpressionSpecification} from 'maplibre-gl';
import {TRAFFIC_COLORS} from './levels';
export function trafficExpression(bands:number[]):ExpressionSpecification{
 const stops:(number|string)[]=[0,TRAFFIC_COLORS[0]];let previous=0;
 bands.forEach((cut,i)=>{const edge=Math.max(previous+.000001,Math.min(.99999,cut));const before=Math.max(previous+.0000001,edge-.0000001);stops.push(before,TRAFFIC_COLORS[i],edge,TRAFFIC_COLORS[i+1]);previous=edge;});stops.push(1,TRAFFIC_COLORS[3]);
 return ['case',['boolean',['feature-state','missing'],false],'#aebbc4',['interpolate',['linear'],['coalesce',['feature-state','probability'],0],...stops]] as ExpressionSpecification;
}
