import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

export const metadata: Metadata = {
  title: 'Prediction Arena — Social Prediction Simulator',
  description: 'Test your market instincts and sports predictions in a competitive, skill-based social simulator with free virtual Practice Coins.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9844234281912376"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="bg-[#07090e] text-slate-100 min-h-screen">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
