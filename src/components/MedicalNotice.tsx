export function MedicalNotice() {
  return (
    <aside className="medical-notice" aria-labelledby="medical-title">
      <h2 id="medical-title">Your care comes first</h2>
      <p>
        This thesis/research app cannot diagnose dengue, provide treatment, or
        dispatch emergency help. Do not wait for a report response or a risk
        label before seeking care.
      </p>
      <p>
        <strong>Seek emergency care immediately</strong> for severe stomach
        pain, repeated vomiting, fast or difficult breathing, bleeding from the
        nose or gums, blood in vomit or stool, extreme thirst, unusual tiredness
        or restlessness, or marked weakness with pale, cold skin. Warning signs
        can appear after a fever improves.
      </p>
      <p>
        If you suspect dengue or have a fever that concerns you, contact a
        qualified health professional promptly.
      </p>
      <a
        className="text-link"
        href="https://www.who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue"
        target="_blank"
        rel="noreferrer"
      >
        WHO: dengue symptoms and warning signs ↗
      </a>
    </aside>
  );
}
