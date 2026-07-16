import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "YBS Topluluğu | DEÜ Öğrenci Platformu",
    template: "%s | YBS Topluluğu",
  },
  description:
    "Dokuz Eylül Üniversitesi öğrencileri için profesyonel ağ ve topluluk platformu. Projelerini paylaş, CV oluştur, toplulukla bağlan.",
  keywords: [
    "DEÜ",
    "Dokuz Eylül",
    "YBS",
    "öğrenci",
    "üniversite",
    "proje",
    "CV",
    "topluluk",
  ],
  authors: [{ name: "YBS Topluluğu" }],
  openGraph: {
    title: "YBS Topluluğu | DEÜ Öğrenci Platformu",
    description:
      "Dokuz Eylül Üniversitesi öğrencileri için profesyonel ağ ve topluluk platformu.",
    type: "website",
    locale: "tr_TR",
    siteName: "YBS Topluluğu",
  },
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
      <body className="min-h-full flex flex-col font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            {children}
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
