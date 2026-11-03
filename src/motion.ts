// Page-wide motion: landing intro (once per visit), gentle scroll reveals with stagger, scroll progress.
// Purely visual: nothing here blocks clicks or hides content when JavaScript or motion is unavailable.
// Everything is skipped for people who ask their device for reduced motion.
const REVEAL=['.forecast-card','.forecast-chart','.alert-actions','.same-week','.forecast-check','.card-tools','.reading-guide',
 '.district-card','.action-card-grid article','.carousel article','.model-invitation','.ncr-overview .section-heading',
 '.model-results','.results-block','.results-facts article','.results-recent','.track-record','.results-glossary>div','.results-levels',
 '#actions>h2','.manila-history','.model-explainer','.about-page .ui-card','.expanded-research section'];
const STAGGER=['.district-grid','.action-card-grid','.results-glossary','.results-facts'];

function intro(){
 try{if(sessionStorage.getItem('dw-intro'))return;sessionStorage.setItem('dw-intro','1');}catch{/* private mode: show once per load */}
 const el=document.createElement('div');el.className='dw-intro';el.setAttribute('aria-hidden','true');
 el.innerHTML='<div class="dw-intro-inner"><svg class="dw-drop" viewBox="0 0 64 80"><path d="M32 4C32 4 8 34 8 50a24 24 0 0 0 48 0C56 34 32 4 32 4Z"/></svg><span class="dw-ring"></span><span class="dw-ring dw-ring-2"></span><p class="dw-word">Dengue<b>Watch</b> <i>AI</i></p><p class="dw-tag">Weekly dengue forecast · City of Manila</p></div>';
 const root=document.documentElement;root.classList.add('dw-intro-playing');document.body.append(el);
 setTimeout(()=>el.classList.add('dw-intro-out'),1500);
 setTimeout(()=>el.remove(),2300);
}

function progress(){
 const bar=document.createElement('div');bar.className='dw-progress';bar.setAttribute('aria-hidden','true');document.body.append(bar);
 let raf=0;const update=()=>{raf=0;const max=document.documentElement.scrollHeight-innerHeight;bar.style.transform=`scaleX(${max>0?Math.min(1,scrollY/max):0})`;};
 addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(update);},{passive:true});update();
}

function reveals(){
 const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('inview');io.unobserve(e.target);}},{threshold:.12,rootMargin:'0px 0px -40px 0px'});
 const scan=()=>{
  for(const parent of document.querySelectorAll<HTMLElement>(STAGGER.join(',')))[...parent.children].forEach((child,i)=>(child as HTMLElement).style.setProperty('--i',String(Math.min(i,8))));
  for(const node of document.querySelectorAll<HTMLElement>(REVEAL.join(',')))if(!node.dataset.motion){node.dataset.motion='1';node.classList.add('m-reveal');
   // Already on screen: animate in right away; below the fold: wait until scrolled into view.
   const r=node.getBoundingClientRect();if(r.top<innerHeight*.9&&r.bottom>0)requestAnimationFrame(()=>node.classList.add('inview'));else io.observe(node);}
 };
 scan();let pending=0;new MutationObserver(()=>{if(!pending)pending=requestAnimationFrame(()=>{pending=0;scan();});}).observe(document.body,{childList:true,subtree:true});
}



export function startMotion(){
 if(typeof window==='undefined'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const run=()=>{document.documentElement.classList.add('motion-ready');intro();progress();reveals();};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
}
