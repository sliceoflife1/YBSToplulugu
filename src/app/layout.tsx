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
    default: "DEÜ YBS Topluluğu | Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri",
    template: "%s | DEÜ YBS Topluluğu",
  },
  description:
    "Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri (YBS) Topluluğu resmi platformu. Öğrenci projeleri, etkinlikler, duyurular, CV havuzu ve iş/staj fırsatları.",
  keywords: [
    "DEÜ",
    "Dokuz Eylül",
    "Dokuz Eylül Üniversitesi",
    "DEÜ YBS",
    "YBS",
    "Yönetim Bilişim Sistemleri",
    "DEÜ YBS Topluluğu",
    "deuybs",
    "deuybs.org.tr",
    "öğrenci topluluğu",
    "yazılım",
    "bilişim",
    "proje",
    "CV",
    "staj",
    "kariyer",
  ],
  authors: [{ name: "DEÜ YBS Topluluğu", url: "https://deuybs.org.tr" }],
  creator: "DEÜ YBS Topluluğu",
  publisher: "DEÜ YBS Topluluğu",
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
    title: "DEÜ YBS Topluluğu | Dokuz Eylül Üniversitesi",
    description:
      "Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri Topluluğu resmi ağı. Projelerini sergile, etkinliklere katıl, ağını büyüt.",
    url: "https://deuybs.org.tr",
    type: "website",
    locale: "tr_TR",
    siteName: "DEÜ YBS Topluluğu",
  },
  twitter: {
    card: "summary_large_image",
    title: "DEÜ YBS Topluluğu | Dokuz Eylül Üniversitesi",
    description:
      "Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri Topluluğu resmi ağı.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": "https://deuybs.org.tr/#organization",
      name: "Dokuz Eylül Üniversitesi Yönetim Bilişim Sistemleri Topluluğu",
      alternateName: "DEÜ YBS Topluluğu",
      url: "https://deuybs.org.tr",
      description:
        "Dokuz Eylül Üniversitesi öğrencileri için profesyonel ağ ve topluluk platformu.",
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
      name: "DEÜ YBS Topluluğu",
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
