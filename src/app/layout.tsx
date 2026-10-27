import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StoreProvider } from "@/lib/store/StoreProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://weave-decision-explorer.vercel.app"),
  title: "Weave Decision Explorer",
  description:
    "Unofficial Routing Decision Explorer for Weave Router — see why each model was picked.",
  openGraph: {
    title: "Why did the router pick that model?",
    description:
      "Unofficial read-only Routing Decision Explorer for Weave Router.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <StoreProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-white"
          >
            Skip to content
          </a>
          <Header />
          <main
            id="main-content"
            className="mx-auto w-full max-w-7xl flex-1 px-4 py-6"
          >
            {children}
          </main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
