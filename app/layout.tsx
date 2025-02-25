import './globals.css';

import { Inter } from 'next/font/google';
import { Analytics } from "@vercel/analytics/react";


const inter = Inter({ subsets: ['latin'] });
export const fetchCache = 'force-no-store';
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
          <main className="pt-16 min-h-screen">
            {children}
            <Analytics />
          </main>
      </body>
    </html>
  );
}