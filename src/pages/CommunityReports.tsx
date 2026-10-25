import {useRedesignLanguage} from '../redesign/Language';
import { ReportingStatus } from "../components/ReportingStatus";
import { Card } from "../components/ui";
import { ReadState } from "../components/PageState";
import { useResource } from "../lib/resources";
import { signalAggregates } from "../lib/signals";
export function CommunityReports({embedded=false,query=''}:{embedded?:boolean;query?:string}) {
  const {t}=useRedesignLanguage();
  const reports = useResource("community-v2", signalAggregates);
  return (
    <div className="ui-container app-content evidence-page">
      <p className="eyebrow">{t('COMMUNITY / UNVERIFIED','KOMUNIDAD / DI-BERIPIKADO')}</p>
      {embedded?<h2>{t('Community reports, kept separate.','Hiwalay na ulat ng komunidad.')}</h2>:<h1>{t('Community reports, kept separate.','Hiwalay na ulat ng komunidad.')}</h1>}
      <Card>
        <p>
          <ReportingStatus /> {t('These are community-reported, unverified awareness signals, never official dengue counts or forecast inputs. Staff approval is a content review, not medical verification.','Di-beripikadong ulat ito ng komunidad, hindi opisyal na bilang o sangkap ng pagtataya. Pagsusuri ng nilalaman ang pag-apruba, hindi medikal na beripikasyon.')}
        </p>
        <p>
          {t('Publication requires at least three approved reports per area/week and a minimum 72-hour delay. Missing or suppressed groups do not mean zero cases. There is no validation history establishing predictive value.','Kailangan ng hindi bababa sa tatlong aprubadong ulat bawat lugar/linggo at 72-oras na paghihintay. Hindi sero ang nawawala o nakatagong grupo. Walang napatunayang kakayahang magtaya ang mga ulat.')}
        </p>
      </Card>
      <ReadState resource={reports}>
        {(rows) => (
          <Card>
            <h2>{t('Published community aggregates','Inilathalang bilang ng komunidad')}</h2>
            {!rows.filter(r=>r.area_label.toLowerCase().includes(query.toLowerCase())).length ? (
              <p>
                {t('No publishable groups. Reports may be absent, awaiting review, delayed or suppressed; no count is inferred.','Walang mailathalang grupo. Maaaring walang ulat, sinusuri pa, naantala o nakatago; walang bilang na hinuhulaan.')}
              </p>
            ) : (
              <div
                className="table-scroll"
                role="region"
                aria-label="Unverified community aggregates"
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      <th scope="col">{t('Coarse area','Malawak na lugar')}</th>
                      <th scope="col">{t('Onset week','Linggo ng sintomas')}</th>
                      <th scope="col">{t('Unverified reports (lower bound)','Di-beripikadong ulat (pinakamababang bilang)')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.filter(r=>r.area_label.toLowerCase().includes(query.toLowerCase())).map((r) => (
                      <tr key={r.area_label + r.week_start}>
                        <th scope="row">{r.area_label}</th>
                        <td>{r.week_start}</td>
                        <td>{r.report_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="muted">
              {t('Source: voluntary community reports, delayed and moderated; displayed onset weeks are historical, not official diagnoses.','Pinagmulan: kusang-loob na ulat ng komunidad, naantala at sinuri; makasaysayang linggo ng sintomas, hindi opisyal na diagnosis.')}
            </p>
          </Card>
        )}
      </ReadState>
    </div>
  );
}
