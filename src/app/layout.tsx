import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CyberShield — Security Operations Dashboard",
  description: "Real-time cybersecurity monitoring and vulnerability analysis",
  // Referrer sparsam setzen – gibt beim Verlassen der Seite keine Pfade preis.
  referrer: "strict-origin-when-cross-origin",
};

// Content-Security-Policy für die statische Seite (per <meta>, da GitHub Pages
// keine HTTP-Header erlaubt). Begrenzt, von wo Skripte/Styles/Verbindungen
// kommen dürfen – das dämmt XSS ein und sperrt ausgehende Verbindungen auf
// bekannte Hosts (eigenes Backend + NVD).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://services.nvd.nist.gov https://internetdb.shodan.io https://crt.sh https://dns.google https://observatory-api.mdn.mozilla.net https://api.pwnedpasswords.com https://security-dashboard-irl5.onrender.com http://localhost:8000",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Hinweis: frame-ancestors (Clickjacking-Schutz) wirkt nur als echter
  // HTTP-Header – per <meta> ignoriert der Browser es. GitHub Pages erlaubt
  // keine eigenen Header; auf eigenem Server/Proxy ergänzen.
].join("; ");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${geistMono.variable} h-full`}>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      </head>
      <body className="min-h-full text-gray-100 font-mono antialiased">{children}</body>
    </html>
  );
}
