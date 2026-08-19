import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, Noto_Sans_Thai } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
});

// Latin-only display face for the presentation deck's English/numeric
// headings (brand name, account handles, hero figures) — Noto Sans Thai
// stays the workhorse for every Thai string.
const displayFont = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CareWell Report",
  description: "รายงานสรุปผู้ติดตาม Line OA และผู้ดูแลที่ลงทะเบียนของ CareWell",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansThai.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 font-[family-name:var(--font-noto-thai)] text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <NavBar />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
