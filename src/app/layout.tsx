import type { Metadata } from 'next';
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
      <body className="bg-[#07090e] text-slate-100 min-h-screen">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
