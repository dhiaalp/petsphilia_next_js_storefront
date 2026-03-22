import type { Metadata } from "next";
import { Nunito, Inter } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from "./components/google-analytics";
import MetaPixel from "./components/meta-pixel";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-script",
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Pets Philia | Personalized Pet Art Gifts",
  description:
    "Turn your pet into cartoon art printed on mugs, t-shirts and hoodies. Personalized pet artwork delivered in Dubai and across the UAE.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const metaPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ?? "";
  const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

  return (
    <html lang="en">
      <body className={`${nunito.variable} ${inter.variable}`}>
        {googleAnalyticsId && <GoogleAnalytics measurementId={googleAnalyticsId} />}
        {metaPixelId && <MetaPixel pixelId={metaPixelId} />}
        {children}
      </body>
    </html>
  );
}
