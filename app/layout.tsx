import './globals.css';

import { Inter } from 'next/font/google';
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Aichic Couture - Admin Backoffice',
  description: 'Backoffice administrateur pour Aichic Couture',
  metadataBase: new URL('https://admin.aichic.tn/'),
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
          <main>
            {children}
          </main>
      </body>
    </html>
  );
}