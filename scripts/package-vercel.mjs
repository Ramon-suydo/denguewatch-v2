import {cp,mkdir,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

export function outputConfiguration(config){
 const sourcePattern=source=>{
  if(source==='/risk-map/:path*')return '/risk-map(?:/.*)?';
  if(source==='/assets/maplibre-gl-worker-:hash.js')return '/assets/maplibre-gl-worker-[^/]+[.]js';
  if(source==='/sw.js')return '/sw[.]js';
  if(source.startsWith('/('))return source;
  throw Error('Review unsupported Vercel header source: '+source);
 };
 const routes=config.headers.map(rule=>({src:sourcePattern(rule.source),headers:Object.fromEntries(rule.headers.map(h=>[h.key,h.value])),continue:true}));
 routes.push({handle:'filesystem'});
 for(const rewrite of config.rewrites)routes.push({src:rewrite.source,dest:rewrite.destination});
 return {version:3,routes};
}

export async function packageVercel(root){
 root=path.resolve(root);
 const input=path.join(root,'dist'),output=path.join(root,'.vercel/output');
 const target=path.join(output,'static');
 if(path.relative(root,target).startsWith('..')||target!==path.join(root,'.vercel','output','static'))throw Error('Unsafe output path');
 async function inspect(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
   if(entry.isSymbolicLink()||/^\.env(?:\.|$)/.test(entry.name)||['.git','.artifacts','node_modules'].includes(entry.name))throw Error('Private or unsupported deployment entry: '+entry.name);
   if(entry.isDirectory())await inspect(path.join(directory,entry.name));
  }
 }
 await inspect(input);
 for(const required of ['index.html','live-manila/weekly.json','research/manila-expanded.json','research/manila-extras.json'])await readFile(path.join(input,required));
 const config=outputConfiguration(JSON.parse(await readFile(path.join(root,'vercel.json'),'utf8')));
 await mkdir(output,{recursive:true});
 await rm(target,{recursive:true,force:true});
 await cp(input,target,{recursive:true});
 await writeFile(path.join(output,'config.json'),JSON.stringify(config,null,2)+'\n');
 console.log(JSON.stringify({passed:true,output,static_files_only:true,routes:config.routes.length}));
 return config;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const root=fileURLToPath(new URL('..',import.meta.url));
 await packageVercel(root);
}
