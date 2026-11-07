'use strict';
if(location.pathname==='/'){const hint=document.createElement('link');hint.rel='preload';hint.as='image';hint.type='image/avif';hint.href='/img/manila-960.avif';hint.imageSrcset=[640,960,1280,1672].map(width=>'/img/manila-'+width+'.avif '+width+'w').join(', ');hint.imageSizes='100vw';hint.fetchPriority='high';document.head.append(hint);}

if(location.pathname==='/'){const shell=document.getElementById('dashboard-prerender'),root=document.getElementById('root');if(shell&&root&&!root.hasChildNodes()){root.append(shell.content.cloneNode(true));root.setAttribute('data-prerendered','true');}}

document.documentElement.dataset.shellReady='true';
