import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import { A11yProvider } from "@/components/a11y-provider";
import { SiteHeader } from "@/components/site-header";

const hyperlegible = Atkinson_Hyperlegible({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: { default: "Cadence", template: "%s · Cadence" },
  description:
    "Create a printable Medical ID card and an easy-to-read medication schedule.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hyperlegible.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <A11yProvider>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <footer className="no-print border-t px-4 py-6 text-center text-muted-foreground">
            Cadence stores everything in this browser only. Nothing is sent to a server.
          </footer>
        </A11yProvider>
      </body>
    </html>
  );
}
