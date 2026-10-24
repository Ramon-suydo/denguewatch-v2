import { Card } from "../components/ui";
import { LanguageControl, useLanguage } from "../components/EvidenceControls";
const DOH =
  "https://ro7.doh.gov.ph/news-and-advisories/98-press-releases/2514-doh-central-visayas-chd-underscores-the-significance-of-4s-in-dengue-mitigation";
const CDC = "https://www.cdc.gov/dengue/signs-symptoms/";
export function Prevention() {
  const { language, setLanguage } = useLanguage(),
    fil = language === "fil";
  return (
    <div className="ui-container app-content evidence-page">
      <LanguageControl value={language} onChange={setLanguage} />
      <p className="eyebrow">
        {fil ? "PAG-IWAS / PANGANGALAGA" : "PREVENTION / EVERYDAY CARE"}
      </p>
      <h1>
        {fil
          ? "Maliliit na hakbang. Araw-araw na proteksiyon."
          : "Small actions. Everyday protection."}
      </h1>
      <p>
        {fil
          ? "Impormasyon lamang; hindi ito pagsusuri o diyagnosis."
          : "Informational, not a diagnosis."}
      </p>
      <Card>
        <h2>{fil ? "4S ng DOH" : "The DOH 4S strategy"}</h2>
        <ol>
          {(fil
            ? [
                "Hanapin at alisin ang pamugaran ng lamok, lalo na ang mga lalagyang may naiipong tubig.",
                "Protektahan ang sarili gamit ang angkop na damit at panlaban sa lamok.",
                "Kumonsulta nang maaga kapag may sintomas.",
                "Suportahan lamang ang fogging sa mga hotspot ayon sa health office.",
              ]
            : [
                "Find and remove mosquito breeding places, including water-holding containers.",
                "Use protective clothing and mosquito repellent.",
                "Seek early consultation when symptoms appear.",
                "Support fogging or spraying in identified hotspots under health-office guidance.",
              ]
          ).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p>
          <a className="text-link" href={DOH}>
            DOH Central Visayas · 4S guidance
          </a>{" "}
          · {fil ? "Sinuri" : "Checked"} 2026-10-25.
        </p>
      </Card>
      <Card>
        <h2>
          {fil
            ? "Mga babalang nangangailangan ng agarang pagpapatingin"
            : "Warning signs need urgent care"}
        </h2>
        <p>
          {fil
            ? "Magpunta agad sa klinika o emergency room kung may matinding pananakit ng tiyan, paulit-ulit na pagsusuka, pagdurugo sa ilong o gilagid, dugo sa suka o dumi, o labis na pagkapagod o pagkabalisa. Maaaring lumitaw ang babala kahit humupa na ang lagnat."
            : "Go to a clinic or emergency room immediately for abdominal pain or tenderness, repeated vomiting, nose or gum bleeding, blood in vomit or stool, or extreme tiredness or restlessness. Warning signs can begin after fever subsides."}
        </p>
        <p>
          {fil
            ? "Huwag hintayin ang antas ng panganib o kumpirmasyon mula sa app bago magpatingin."
            : "Do not wait for an app risk level or report confirmation before seeking care."}
        </p>
        <p>
          <a className="text-link" href={CDC}>
            CDC · dengue symptoms and warning signs
          </a>{" "}
          · {fil ? "Sinuri" : "Checked"} 2026-10-25.
        </p>
      </Card>
    </div>
  );
}
