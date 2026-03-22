import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { Header } from '@widgets/ui/Header';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
                try {
                  var s = JSON.parse(localStorage.getItem('theme') || '{}');
                  var t = (s && s.state && s.state.theme) || 'system';
                  var d =
                    t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme:dark)').matches);
                  document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light');
                } catch (e) {}
            })()`,
          }}
        />
      </head>
      <body className="min-h-full">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
