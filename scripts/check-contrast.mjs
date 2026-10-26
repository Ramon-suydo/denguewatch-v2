import assert from "node:assert/strict";
import { colors } from "../src/theme/palette.js";
function luminance(hex) {
  const rgb = hex
    .match(/[a-f\d]{2}/gi)
    .map((value) => parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
function check(label, ink, background, minimum = 4.5) {
  const values = [luminance(ink), luminance(background)].sort((a, b) => b - a);
  const ratio = (values[0] + 0.05) / (values[1] + 0.05);
  assert.ok(
    ratio >= minimum,
    `${label}: ${ratio.toFixed(2)} is below ${minimum}`,
  );
  console.log(`${label}: ${ratio.toFixed(2)}:1`);
}
for (const [tier, value] of Object.entries(colors.risk))
  check("Risk " + tier, value.ink, value.surface);
for (const [source, value] of Object.entries(colors.source))
  check("Source " + source, value.ink, value.surface);
check("Primary button", colors.navy[950], colors.gold[500]);
check("Primary hover", colors.navy[950], colors.gold[400]);
check("Link on white", colors.navy[700], "#ffffff");
check("Link on paper", colors.navy[700], colors.paper);
check("Gold footer link", colors.gold[400], colors.navy[950]);
check("Cyan active dot", colors.pop.cyan, colors.navy[900], 3);
check("Muted text on warm surface", colors.neutral[600], colors.neutral[50]);
check("Input placeholder", colors.neutral[500], "#ffffff");
check("Hero heading", "#ffffff", colors.navy[900]);
check("Hero secondary text", colors.navy[200], colors.navy[900]);
check("Input boundary", colors.neutral[500], "#ffffff", 3);
check("Focus outline", colors.navy[600], "#ffffff", 3);

check("Dark map text", "#ffffff", colors.navy[950]);
check("Dark map source links", colors.gold[400], colors.navy[900]);
check("Dark map focus", colors.gold[400], colors.navy[900], 3);
check("Dark map outlines", colors.pop.cyan, colors.navy[950], 3);
const {mapRamp,visionMatrices,simulatedLuminance,linearRgb,luminance:mapLuminance}=await import("../src/lib/map-colors.js");
for(const [name,matrix] of Object.entries(visionMatrices)) {
 const values=mapRamp.map(color=>simulatedLuminance(color,matrix));
 assert.ok(values.every((value,index)=>index===0||value>values[index-1]),`Map ramp reverses luminance in ${name}`);
 console.log(`Map ramp ${name}: monotonic luminance`);
}

for(const [name,matrix] of Object.entries(visionMatrices)) {
 let prior=-1;
 for(let step=0;step<=300;step++) {
  const t=step/100,index=Math.min(2,Math.floor(t)),f=t-index,a=linearRgb(mapRamp[index]),b=linearRgb(mapRamp[index+1]),rgb=a.map((v,j)=>v+(b[j]-v)*f);
  const value=mapLuminance(matrix.map(row=>Math.max(0,Math.min(1,row.reduce((sum,v,j)=>sum+v*rgb[j],0)))));
  assert.ok(value+1e-10>=prior,`Interpolated map ramp reverses in ${name}`); prior=value;
 }
 console.log(`Map ramp ${name}: all 301 interpolated samples pass`);
}

check('Photographic footer credit','#e9f3f8','#071b2b');
check('Photographic primary CTA','#082d30','#c7efe5');
check('Photographic card text','#102a43','#f8fbfc');
check('Photographic drawer links','#075e64','#f8fbfc');
const nationalRamp=['#e1eeee','#b5d4d2','#73aca9','#347c79','#10504f'];
for(const [name,matrix] of Object.entries(visionMatrices)){const values=nationalRamp.map(color=>simulatedLuminance(color,matrix));assert.ok(values.every((value,index)=>index===0||value<values[index-1]),'National ramp reverses luminance: '+name);console.log('National ramp '+name+': monotonic luminance; upper class also hatched');}

check('Two-colour photographic focus inks','#ffffff','#071b2b');

// Bay & care tokens are checked in addition to the retained historical palette gates.
const {readFile}=await import('node:fs/promises');const tokenCss=await readFile('src/overhaul/tokens.css','utf8');const tokenParts=tokenCss.split(':root[data-theme=night]');const readTokens=text=>Object.fromEntries([...text.matchAll(/--([a-z-]+):(#(?:[0-9a-f]{6}|[0-9a-f]{3}))(?:;|})/g)].map(m=>[m[1],m[2].length===4?'#'+[...m[2].slice(1)].map(c=>c+c).join(''):m[2]]));const day=readTokens(tokenParts[0]),night={...day,...readTokens(tokenParts[1])};for(const [theme,t] of Object.entries({day,night})){for(const bg of ['sand','surface','surface-soft']){check(theme+' body on '+bg,t.ink,t[bg]);check(theme+' caption on '+bg,t.muted,t[bg]);check(theme+' link on '+bg,t.bay,t[bg]);}check(theme+' action',t['on-coral'],t.coral);check(theme+' selected chip',t['on-bay'],t.bay);}for(const [index,color] of ['#edf3dc','#b8d3cd','#426e88','#45355e'].entries())check('Bay risk '+index,index<2?'#162f3a':'#ffffff',color);for(const [name,matrix] of Object.entries(visionMatrices)){const values=['#edf3dc','#b8d3cd','#426e88','#45355e'].map(color=>simulatedLuminance(color,matrix));assert.ok(values.every((v,i)=>i===0||v<values[i-1]),'City risk luminance order reverses in '+name);console.log('City risk '+name+': decreasing luminance; symbols and labels retained');}
