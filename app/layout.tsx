import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// latin-ext carries the ₦ sign.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fut-homes.vercel.app"),
  title: {
    default: "FUT Homes · Rooms near FUTMINNA from ID-checked agents",
    template: "%s · FUT Homes",
  },
  description:
    "Find a room near Bosso or Gidan Kwano campus. Real videos, ID-checked agents, and you pay only after you inspect.",
  openGraph: { siteName: "FUT Homes", locale: "en_NG", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#4A2C8F",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={`${jakarta.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-bg font-sans text-ink">{children}</body>
    </html>
  );
}
