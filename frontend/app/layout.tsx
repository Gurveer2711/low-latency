import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "../components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ViewTube - Seamless Video Streaming Platform",
  description: "Experience ultra low latency, high quality video playback with seamless quality switching and a clean modern interface.",
  keywords: "video streaming, next.js, hls, low latency, youtube clone",
  authors: [{ name: "Antigravity Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-sans antialiased text-text-primary bg-background-secondary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
