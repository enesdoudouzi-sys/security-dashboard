// Zentrale Backend-Adresse für das (optionale) Scanner-Backend.
// Lokal (Entwicklung) läuft das Backend auf localhost:8000.
// Im Web zeigt es auf den Render-Dienst – ist dort keiner deployed,
// bleibt das Backend einfach "offline". Das Dashboard funktioniert auch
// komplett ohne Backend: alle Analyse-Tabs laufen rein im Browser.
export const BACKEND =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://security-dashboard-irl5.onrender.com";

// Das Backend ist nur für LIVE-Nmap-Scans nötig (Scans / Schwachstellen-Scan).
export const BACKEND_IS_OPTIONAL = true;
