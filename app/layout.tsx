import './globals.css';

import { Inter } from 'next/font/google';
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Dar Al Koftan Al Assil - Admin Backoffice',
  description: 'Backoffice administrateur pour Dar Al Koftan Al Assil',
  metadataBase: new URL('https://admin.daralkoftanalassil.com/'),
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
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
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body className={inter.className}>
          <main>
            {children}
          </main>
      </body>
    </html>
  );
}