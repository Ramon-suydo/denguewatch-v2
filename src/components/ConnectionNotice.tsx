import { useEffect, useState } from "react";
export function ConnectionNotice() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return !online ? (
    <div className="evidence-banner" role="status">
      Offline · showing previously loaded historical research data. Reports
      cannot be submitted offline.
    </div>
  ) : null;
}
