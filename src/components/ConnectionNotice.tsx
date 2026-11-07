import {useRedesignLanguage} from '../redesign/Language';
import { useEffect, useState } from "react";
export function ConnectionNotice() {
  const {t}=useRedesignLanguage();
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return !online ? (
    <div className="evidence-banner" role="status">
      {t('Offline · showing previously loaded historical research data. Reports cannot be submitted offline.','Offline · ipinapakita ang dating na-load na makasaysayang datos. Hindi makapagpapadala ng ulat habang offline.')}
    </div>
  ) : null;
}
