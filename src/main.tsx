import { StrictMode } from "react";
import { createRoot,hydrateRoot } from "react-dom/client";
import "@fontsource/fraunces/latin-600.css";
import "@fontsource/figtree/latin-400.css";
import "@fontsource/figtree/latin-500.css";
import "@fontsource/figtree/latin-600.css";
import "@fontsource/figtree/latin-700.css";
import "./index.css";
import { App } from "./App";
import "./app.css";
import "./evidence.css";
import "./redesign.css";
import "./ml-map.css";
import "./overhaul/tokens.css";
import "./overhaul/overhaul.css";
import { ToastProvider } from "./components/ui/Toast";
let mounted=false;function mount(){if(mounted)return;mounted=true;const root=document.getElementById('root')!,tree=<StrictMode><ToastProvider><App/></ToastProvider></StrictMode>;if(root.hasAttribute('data-prerendered'))hydrateRoot(root,tree);else createRoot(root).render(tree);}if(document.documentElement.dataset.shellReady==='true')mount();else window.addEventListener('DOMContentLoaded',mount,{once:true});

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const install = () => { void navigator.serviceWorker.register("/sw.js").catch(() => { /* Public pages remain usable if offline setup fails. */ }); };
    // Let the first screen settle before downloading the full offline catalogue.
    window.setTimeout(() => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(install, {timeout: 2000});
      else install();
    }, 3000);
  }, {once: true});
}
