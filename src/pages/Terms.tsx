import { Card } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { TermsDraft } from "../components/LegalDrafts";
export function Terms() { return <><PageHeader eyebrow="USING DENGUEWATCH" title="Terms with a clear purpose." description="Educational/research prototype; draft for review." /><div className="dw-container app-content narrow-content"><Card><TermsDraft /></Card></div></>; }
