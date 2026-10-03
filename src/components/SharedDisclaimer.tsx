export function SharedDisclaimer({ id = "shared-disclaimer-title" }: { id?: string }) {
  return (
    <aside className="data-notice" aria-labelledby={id}>
      <h2 id={id} className="eyebrow">Estimates, not alerts</h2>
      <p>
        Forecasts are statistical estimates from historical published data.
        They are not medical advice, an emergency or outbreak alert, or a
        substitute for guidance from the DOH or your local health office.
        Community reports are unverified and are not part of official data.
        This app does not provide real-time surveillance.
      </p>
    </aside>
  );
}
