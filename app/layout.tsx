import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NIFTY 50 Quantitative Microstructure & Sector Radar",
  description: "Live constituent point impact, sector co-dependency matrix, and microstructure anomaly scanner for Nifty 50.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
