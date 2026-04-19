import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { getLocale } from 'next-intl/server';
import { ThemeScript } from '@shared/lib/theme/ThemeScript';
import '@app/globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Hedgeflix',
    template: '%s | Hedgeflix',
  },
  description: 'Catalog Movies',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
