export function MonitoringLine({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 480 140"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0 84H95L121 70L150 91L181 38L214 105L245 62L269 84H480"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M0 114H480M0 54H480M60 0V140M180 0V140M300 0V140M420 0V140"
        stroke="currentColor"
        opacity=".2"
      />
      <circle cx="269" cy="84" r="5" fill="currentColor" />
    </svg>
  );
}
