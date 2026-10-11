import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FUT Homes",
  description: "Verified off-campus accommodation for FUTMINNA students.",
};

// System fonts only: nothing extra to download on slow data.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-neutral-900">
        {children}
      </body>
    </html>
  );
}
