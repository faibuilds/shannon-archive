import type { Metadata, Viewport } from "next";
import { Poppins, IBM_Plex_Mono, Saira_Stencil_One } from "next/font/google";
import Script from "next/script";
import { UIProvider } from "@/lib/ui";
import Aurora from "@/components/Aurora";
import Starfield from "@/components/Starfield";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});
const saira = Saira_Stencil_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-saira",
  display: "swap",
});

const SITE_URL = "https://shannon.engineeringcommunity.net";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "SHANNON | Engineering Community's Story Archive",
  description:
    "SHANNON is Engineering Community's story archive. Ten lines live, from military aircraft and semiconductors to bridges, cars, and ships, all recorded as verified claims in one connected graph.",
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.png" },
  openGraph: {
    title: "SHANNON | Engineering Community's Story Archive",
    description:
      "Ten lines live, from the P-38 to the transistor: aircraft, semiconductors, materials, cars, ships, and the rules written after things went wrong. Each story is verified claims in one connected graph. Sealed plates declassify as we publish.",
    type: "website",
    url: "/",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "Engineering Community",
      url: "https://engineeringcommunity.net/",
      sameAs: ["https://www.linkedin.com/company/engineeringcommunity/"],
      logo: { "@type": "ImageObject", url: `${SITE_URL}/og.png` },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: "SHANNON",
      description: "Engineering Community's public story archive.",
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@type": "CollectionPage",
      "@id": `${SITE_URL}/#webpage`,
      url: `${SITE_URL}/`,
      name: "SHANNON, Engineering Community's Story Archive",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about:
        "The engineering behind ten live lines: military aircraft, engineering failures, regulation written in blood, automotive safety, materials, computing foundations, aviation foundations, commercial aviation, prime movers, and semiconductors.",
      inLanguage: "en",
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${plexMono.variable} ${saira.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <UIProvider>
          <Aurora />
          <Starfield />
          {children}
        </UIProvider>
        <Script src="https://tally.so/widgets/embed.js" strategy="lazyOnload" />
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          strategy="lazyOnload"
          data-cf-beacon='{"token": "60311277a5524493bec323ed4bde708d"}'
        />
      </body>
    </html>
  );
}
