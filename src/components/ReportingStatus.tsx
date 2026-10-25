import {useRedesignLanguage} from '../redesign/Language';
import { useResource } from "../lib/resources";
import { signalPolicy } from "../lib/signals";
export function ReportingStatus({compact=false}:{compact?:boolean}) {
 const {t}=useRedesignLanguage();
 const policy=useResource("reporting-policy-status",signalPolicy);
 if(compact)return <span role="status">{t('Community reports:','Ulat ng komunidad:')} {policy.loading?t('checking','sinusuri'):policy.data?.enabled?t('open','bukas'):t('closed','sarado')}</span>;
 return <span role="status">{policy.loading?t('Checking reporting status…','Sinusuri ang pagtanggap ng ulat…'):policy.data?.enabled?t('Community reporting is open for unverified awareness signals.','Bukas ang pagtanggap ng di-beripikadong ulat ng komunidad.'):t('Community reporting is closed.','Sarado ang pagtanggap ng ulat ng komunidad.')}</span>;
}
