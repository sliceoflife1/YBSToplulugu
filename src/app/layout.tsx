import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";
import LegalConsentModal from "@/components/layout/legal-consent-modal";
import AuthErrorListener from "@/components/auth/auth-error-listener";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://deuybs.org.tr"),
  title: {
    default: "DEÜ YBS (DEU YBS) | Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri Ağı",
    template: "%s | DEÜ YBS (DEU YBS)",
  },
  description:
    "DEÜ YBS'nin Gücü Tek Çatıda: Öğrenci, Mezun ve Sektör El Ele. Kampüsten profesyonel dünyaya uzanan en güçlü bağ. Profilini oluştur, yeteneklerini sergile, staj ve kariyer fırsatlarını doğrudan ekosistemin içinden yakala.",
  keywords: [
    "deu ybs",
    "deü ybs",
    "DEÜ YBS",
    "DEU YBS",
    "dokuz eylül ybs",
    "dokuz eylül üniversitesi ybs",
    "deu yönetim bilişim sistemleri",
    "deü yönetim bilişim sistemleri",
    "deuybs",
    "deuybs.org.tr",
    "DEÜ YBS Ağı",
    "Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri Ağı",
    "DEU MIS",
    "DEU Management Information Systems",
    "YBS",
    "Yönetim Bilişim Sistemleri",
    "öğrenci ağı",
    "staj",
    "kariyer",
    "yazılım",
    "bilişim",
    "proje",
    "CV",
  ],
  authors: [{ name: "Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri Ağı", url: "https://deuybs.org.tr" }],
  creator: "Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri Ağı",
  publisher: "Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri Ağı",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/icon.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/logo.png?v=2", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: [
      { url: "/logo.png?v=2", sizes: "180x180", type: "image/png" },
    ],
  },
  alternates: {
    canonical: "https://deuybs.org.tr",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "KJb8aJQTOsWAp_K6v99pfhfVID7lxH-hwVSX4HDSKGo",
  },
  openGraph: {
    title: "DEÜ YBS (DEU YBS) | Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri Ağı",
    description:
      "DEÜ YBS'nin Gücü Tek Çatıda: Öğrenci, Mezun ve Sektör El Ele. Kampüsten profesyonel dünyaya uzanan en güçlü bağ. Profilini oluştur, yeteneklerini sergile, staj ve kariyer fırsatlarını doğrudan ekosistemin içinden yakala.",
    url: "https://deuybs.org.tr",
    type: "website",
    locale: "tr_TR",
    siteName: "DEÜ YBS Ağı",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "DEÜ YBS (DEU YBS) Ağı Logosu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DEÜ YBS (DEU YBS) | Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri Ağı",
    description:
      "DEÜ YBS'nin Gücü Tek Çatıda: Öğrenci, Mezun ve Sektör El Ele. Kampüsten profesyonel dünyaya uzanan en güçlü bağ.",
    images: ["/logo.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": "https://deuybs.org.tr/#organization",
      name: "Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri Ağı",
      alternateName: ["DEÜ YBS", "DEU YBS", "Dokuz Eylül YBS", "DEU MIS", "DEÜ YBS Ağı"],
      url: "https://deuybs.org.tr",
      logo: "https://deuybs.org.tr/logo.png",
      image: "https://deuybs.org.tr/logo.png",
      sameAs: [
        "https://www.instagram.com/deuybs/",
        "https://www.youtube.com/@deuybs",
        "https://www.deu.edu.tr",
      ],
      description:
        "DEÜ YBS'nin Gücü Tek Çatıda: Öğrenci, Mezun ve Sektör El Ele. Kampüsten profesyonel dünyaya uzanan en güçlü bağ.",
      parentOrganization: {
        "@type": "CollegeOrUniversity",
        name: "Dokuz Eylül Üniversitesi",
        url: "https://deu.edu.tr",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://deuybs.org.tr/#website",
      url: "https://deuybs.org.tr",
      name: "DEÜ YBS (DEU YBS) Ağı",
      alternateName: "Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri Ağı",
      publisher: {
        "@id": "https://deuybs.org.tr/#organization",
      },
      inLanguage: "tr-TR",
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png?v=2" />
        <link rel="apple-touch-icon" href="/logo.png?v=2" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            {children}
            <LegalConsentModal />
            <Suspense fallback={null}>
              <AuthErrorListener />
            </Suspense>
            <Toaster
              position="bottom-right"
              richColors
              closeButton
              toastOptions={{
                duration: 4000,
              }}
            />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
