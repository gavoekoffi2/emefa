import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050816" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "EMEFA — Plateforme d'Assistants IA Africaine",
    template: "%s | EMEFA",
  },
  description:
    "Créez et déployez des assistants IA personnalisés connectés à vos données. Chat, voix, Telegram, WhatsApp — en quelques minutes.",
  keywords: ["assistant IA", "chatbot", "intelligence artificielle", "Afrique", "SaaS", "LiveKit", "voix", "Telegram", "WhatsApp"],
  authors: [{ name: "EMEFA" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "EMEFA",
    title: "EMEFA — Plateforme d'Assistants IA Africaine",
    description: "Créez et déployez des assistants IA personnalisés connectés à vos données.",
  },
  twitter: {
    card: "summary_large_image",
    title: "EMEFA — Plateforme d'Assistants IA Africaine",
    description: "Créez et déployez des assistants IA personnalisés connectés à vos données.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
