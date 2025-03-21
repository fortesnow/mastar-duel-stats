import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "../components/AuthProvider";

const inter = Inter({ subsets: ["latin"], display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  title: "遊戯王マスターデュエル 統計アプリ",
  description: "デュエリストカップの対戦データを記録・分析するアプリケーション",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'マスターデュエル統計',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="antialiased">
      <body className={`${inter.className} min-h-screen text-base`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
