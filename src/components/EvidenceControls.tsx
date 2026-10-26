import { useEffect, useRef, useState } from "react";
import { Select } from "./ui/Select";
import type { Scenario } from "../lib/evidence";
export function ScenarioControl({
  value,
  onChange,
  language = "en",
}: {
  value: Scenario;
  onChange: (value: Scenario) => void;
  language?: "en" | "fil";
}) {
  const fil = language === "fil";
  return (
    <>
      <Select
        label={
          fil ? "Pagpapalagay sa petsang walang tala" : "Absent-day scenario"
        }
        value={value}
        onChange={(e) => onChange(e.target.value as Scenario)}
      >
        <option value="M">
          {fil
            ? "M · nananatiling hindi alam ang walang tala"
            : "M · absent dates remain missing"}
        </option>
        <option value="Z">
          {fil
            ? "Z · ipinapalagay na sero ang walang tala"
            : "Z · absent dates assumed zero"}
        </option>
      </Select>
      <p className="muted">
        {fil
          ? value === "M"
            ? "Linggong may tala sa lahat ng pitong araw lamang ang sinusuri. Ang petsang walang tala ay hindi awtomatikong sero."
            : "Ipinapalagay na sero ang araw na walang tala sa loob ng saklaw ng datos. Hindi ito kumpirmado."
          : value === "M"
            ? "Only weeks with seven daily rows are scored. An absent date is not a recorded zero."
            : "Zero is assumed only for absent dates within supplied coverage. This is unconfirmed."}{" "}
        {fil
          ? "Hindi kasama ang huling di-buong linggo sa alinmang pagsusuri."
          : "The final partial week is excluded in both scenarios."}
      </p>
    </>
  );
}
export function useLanguage() {
  const [language, setLanguage] = useState<"en" | "fil">(() => {
    try {
      if(document.getElementById("root")?.hasAttribute("data-prerendered"))return "en";
      return localStorage.getItem("dw-language") === "fil" ? "fil" : "en";
    } catch {
      return "en";
    }
  });
  const restore=useRef(typeof document!=='undefined'&&Boolean(document.getElementById('root')?.hasAttribute('data-prerendered')));
  useEffect(()=>{if(restore.current){try{setLanguage(localStorage.getItem('dw-language')==='fil'?'fil':'en');}catch{}}},[]);
  useEffect(()=>{const receive=(event:Event)=>{const next=(event as CustomEvent).detail;if(next==='en'||next==='fil')setLanguage(next);};window.addEventListener('dw-language-change',receive);return()=>window.removeEventListener('dw-language-change',receive);},[]);
  useEffect(() => {
    if(restore.current){restore.current=false;return;}
    document.documentElement.lang = language;
    try {
      localStorage.setItem("dw-language", language);
      window.dispatchEvent(new CustomEvent("dw-language-change",{detail:language}));
    } catch {}
  }, [language]);
  return { language, setLanguage };
}
export function LanguageControl({
  value,
  onChange,
}: {
  value: "en" | "fil";
  onChange: (v: "en" | "fil") => void;
}) {
  return (
    <div className="language-control" aria-label="Page language">
      <button
        type="button"
        className="ui-button ui-button-ghost"
        aria-pressed={value === "en"}
        onClick={() => onChange("en")}
      >
        English
      </button>
      <button
        type="button"
        className="ui-button ui-button-ghost"
        aria-pressed={value === "fil"}
        onClick={() => onChange("fil")}
      >
        Filipino
      </button>
    </div>
  );
}
