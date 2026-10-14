import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

// latin-ext carries the ₦ sign. Variable font: one file covers 400–800.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fut-homes.vercel.app"),
  title: {
    default: "FUT Homes · Rooms near FUTMINNA from verified agents",
    template: "%s · FUT Homes",
  },
  description:
    "Find a room near Bosso or Gidan Kwano campus. Real videos, verified agents, and you pay only after you inspect.",
  openGraph: { siteName: "FUT Homes", locale: "en_NG", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#F3EEFF",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={`${bricolage.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-bg font-sans text-ink">{children}</body>
    </html>
  );
}
