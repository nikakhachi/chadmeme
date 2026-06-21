import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "ChadMeme — Trade memecoins on Solana",
  description:
    "The best memecoin trading app. Trending tokens, live charts, and one-tap trading on Solana.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

// Matches chadwallet.xyz's warm near-black browser chrome.
export const viewport: Viewport = {
  themeColor: "#080404",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
