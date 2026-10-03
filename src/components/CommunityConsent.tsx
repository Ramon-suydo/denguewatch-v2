import { Link } from "react-router-dom";
import { Checkbox } from "./ui";
import { COMMUNITY_CONSENT } from "../lib/legal";
export function CommunityConsent({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return <div className="prose" data-consent-version={COMMUNITY_CONSENT.version}>
    <p>Consent draft for review · {COMMUNITY_CONSENT.version}. Collection remains closed until launch review.</p>
    <Checkbox required label={<>{COMMUNITY_CONSENT.text}{" "}<Link to="/legal#privacy">Privacy</Link>{" · "}<Link to="/legal#terms">Terms</Link></>} checked={checked} onChange={e => onChange(e.target.checked)} />
    <p>Save the DW- code shown once after an authorized submission. Only its hash is stored. Use <Link to="/privacy#withdraw">withdrawal by code</Link> to remove the report from public counts; there is no public code lookup or recovery.</p>
  </div>;
}
