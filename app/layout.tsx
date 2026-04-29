import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Keuangan Pribadi",
  description: "Aplikasi pengelolaan keuangan pribadi, investasi, dan zakat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full">
      <body className={`min-h-full flex flex-col ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
