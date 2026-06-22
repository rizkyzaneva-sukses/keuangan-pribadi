import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
