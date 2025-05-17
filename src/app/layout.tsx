import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Hava Kalitesi Takibi | Anlık Hava Durumu ve PM Değerleri",
  description: "Türkiye'nin en kapsamlı hava kalitesi takip platformu. Anlık PM2.5, PM10 değerleri ve detaylı hava kalitesi analizi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
