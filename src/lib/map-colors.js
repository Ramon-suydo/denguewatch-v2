import {colors} from "../theme/palette.js";
function accessibleCyan(hex){
 const rgb=hex.match(/[a-f\d]{2}/gi).map(value=>parseInt(value,16)/255).map(v=>(v<=.04045?v/12.92:((v+.055)/1.055)**2.4)*.9);
 // Keep the cyan hue while avoiding negative red in the tritanopia transform.
 rgb[0]=Math.max(rgb[0],(.076749*rgb[1]+.178779*rgb[2])/1.255528+.002);
 return "#"+rgb.map(v=>Math.round(255*(v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055)).toString(16).padStart(2,"0")).join("");
}
// Only the map stop changes: dim linear light and lift red slightly for CVD gamut.
export const mapRamp=[colors.navy[800],colors.cobalt[500],accessibleCyan(colors.pop.cyan),colors.gold[400]];
export const linearRgb=hex=>hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
export const luminance=rgb=>.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
export const visionMatrices={normal:[[1,0,0],[0,1,0],[0,0,1]],protanopia:[[.152286,1.052583,-.204868],[.114503,.786281,.099216],[-.003882,-.048116,1.051998]],deuteranopia:[[.367322,.860646,-.227968],[.280085,.672501,.047413],[-.01182,.04294,.968881]],tritanopia:[[1.255528,-.076749,-.178779],[-.078411,.930809,.147602],[.004733,.691367,.3039]]};
export function simulatedLuminance(hex,matrix){const rgb=linearRgb(hex);return luminance(matrix.map(row=>Math.max(0,Math.min(1,row.reduce((sum,v,i)=>sum+v*rgb[i],0)))));}
export function mapColor(value,min,max){if(value===null)return "url(#no-data)";const t=max===min ? .5 : Math.max(0,Math.min(1,(value-min)/(max-min))),scaled=t*(mapRamp.length-1),i=Math.min(mapRamp.length-2,Math.floor(scaled)),f=scaled-i;const a=linearRgb(mapRamp[i]),b=linearRgb(mapRamp[i+1]);return `rgb(${a.map((v,j)=>{const linear=v+(b[j]-v)*f;return Math.round(255*(linear<=.0031308?12.92*linear:1.055*linear**(1/2.4)-.055));}).join(" ")})`;}
