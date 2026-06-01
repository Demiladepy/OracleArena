import type { Metadata } from 'next';
import { Libre_Baskerville, DM_Sans, JetBrains_Mono } from 'next/font/google';
import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import { Providers } from './providers';

const display = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-display',
});

const sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Oracle Arena',
  description: 'The resolution layer for the agentic economy',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
