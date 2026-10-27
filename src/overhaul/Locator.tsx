import {useRedesignLanguage} from '../redesign/Language';
// Derived from the project's Philippines and NCR boundaries; no tile or geometry request.
export function Locator(){const {t}=useRedesignLanguage();return <figure className="footer-locator"><img loading="lazy" decoding="async" src="/img/locator.svg" width="120" height="152" alt={t('Philippines, with Metro Manila highlighted','Pilipinas, nakatampok ang Metro Manila')}/><figcaption>{t('Metro Manila, Philippines','Metro Manila, Pilipinas')}</figcaption></figure>}
