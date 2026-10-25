import {useRedesignLanguage} from '../redesign/Language';
export function SharedDisclaimer({ id = "shared-disclaimer-title" }: { id?: string }) {
  const {t}=useRedesignLanguage();
  return (
    <aside className="data-notice" aria-labelledby={id}>
      <h2 id={id} className="eyebrow">{t('Estimates, not alerts','Pagtataya, hindi babala')}</h2>
      <p>
        {t('Forecasts are statistical estimates from historical published data. They are not medical advice, an emergency or outbreak alert, or a substitute for guidance from the DOH or your local health office. Community reports are unverified and are not part of official data. This app does not provide real-time surveillance.','Estadistikal na pagtataya mula sa lumang nailathalang datos ang mga ito. Hindi ito payong medikal, babala ng emergency o outbreak, o kapalit ng gabay ng DOH at lokal na health office. Hindi beripikado at hindi opisyal na datos ang ulat ng komunidad. Walang real-time surveillance ang app.')}
      </p>
    </aside>
  );
}
