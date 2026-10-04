import type {Feature,Polygon,MultiPolygon,Position} from "geojson";
export type Boundary = Feature<Polygon|MultiPolygon>;
export const polygonRings=(feature:Boundary)=>feature.geometry.type==="Polygon"?[feature.geometry.coordinates]:feature.geometry.coordinates;
export const vertexCount=(feature:Boundary)=>polygonRings(feature).flat().reduce((sum,ring)=>sum+ring.length,0);
export function signedArea(ring:Position[]){const [x,y]=ring[0];return ring.slice(1).reduce((sum,b,i)=>sum+(ring[i][0]-x)*(b[1]-y)-(b[0]-x)*(ring[i][1]-y),0)/2;}
export function rewindForD3(feature:Boundary){for(const polygon of polygonRings(feature))for(let i=0;i<polygon.length;i++){const ring=polygon[i];if((signedArea(ring)>0)===(i===0))ring.reverse();}return feature;}
export function coordinateBounds(features:Boundary[]){const points=features.flatMap(f=>polygonRings(f).flat(2));return [Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];}
const equal=(a:Position,b:Position)=>a[0]===b[0]&&a[1]===b[1];
function intersects(a:Position,b:Position,c:Position,d:Position){
 if(Math.max(a[0],b[0])<Math.min(c[0],d[0])||Math.max(c[0],d[0])<Math.min(a[0],b[0])||Math.max(a[1],b[1])<Math.min(c[1],d[1])||Math.max(c[1],d[1])<Math.min(a[1],b[1]))return false;
 const cross=(p:Position,q:Position,r:Position)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
 const x=cross(a,b,c),y=cross(a,b,d),u=cross(c,d,a),v=cross(c,d,b);return x*y<=0&&u*v<=0;
}
function inside(point:Position,ring:Position[]){let result=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])result=!result;}return result;}
export function geometryIssue(feature:Boundary,bounds:number[]):string|null{
 const polygons=polygonRings(feature);
 for(const polygon of polygons){for(let index=0;index<polygon.length;index++){
  const ring=polygon[index];if(ring.length<5||new Set(ring.slice(0,-1).map(p=>`${p[0]},${p[1]}`)).size<4)return "Fewer than four distinct vertices";
  if(!equal(ring[0],ring[ring.length-1]))return "Unclosed ring";
  if(ring.some(p=>!Number.isFinite(p[0])||!Number.isFinite(p[1])))return "Non-finite coordinate";
  if(ring.some(([x,y])=>x<bounds[0]-1e-9||x>bounds[2]+1e-9||y<bounds[1]-1e-9||y>bounds[3]+1e-9))return "Outside source-derived Manila bounding box";
  if(!signedArea(ring))return "Zero ring area";
  if(index&& !inside(ring[0],polygon[0]))return "Hole outside exterior ring";
  for(let i=0;i<ring.length-1;i++){if(equal(ring[i],ring[i+1]))return "Repeated consecutive coordinate";for(let j=i+2;j<ring.length-1;j++){if(i===0&&j===ring.length-2)continue;if(intersects(ring[i],ring[i+1],ring[j],ring[j+1]))return "Self-intersecting ring";}}
 }
 for(let i=0;i<polygon.length;i++)for(let j=i+1;j<polygon.length;j++){
  for(let a=0;a<polygon[i].length-1;a++)for(let b=0;b<polygon[j].length-1;b++)if(intersects(polygon[i][a],polygon[i][a+1],polygon[j][b],polygon[j][b+1]))return "Intersecting polygon rings";
  if(i>0&&(inside(polygon[i][0],polygon[j])||inside(polygon[j][0],polygon[i])))return "Overlapping holes";
 }
 }
 for(let i=0;i<polygons.length;i++)for(let j=i+1;j<polygons.length;j++){
  if(inside(polygons[i][0][0],polygons[j][0])||inside(polygons[j][0][0],polygons[i][0]))return "Overlapping polygon components";
  for(let a=0;a<polygons[i][0].length-1;a++)for(let b=0;b<polygons[j][0].length-1;b++)if(intersects(polygons[i][0][a],polygons[i][0][a+1],polygons[j][0][b],polygons[j][0][b+1]))return "Intersecting polygon components";
 }
 return null;
}
