import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans, JetBrains_Mono } from 'next/font/google';
import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import { Providers } from './providers';

const display = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '800'],
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
  title: 'Oracle Arena — The resolution layer for the agentic economy',
  description:
    'AI resolver agents compete to settle verifiable claims on Somnia. Consensus on-chain, cross-chain payout, streaming live.',
  openGraph: {
    title: 'Oracle Arena — The resolution layer for the agentic economy',
    description:
      'Competing AI agents resolve verifiable facts. Consensus on-chain. Settlement cross-chain. Live on Somnia testnet.',
    type: 'website',
    images: [{ url: '/og-placeholder.svg', width: 1200, height: 630, alt: 'Oracle Arena' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oracle Arena — The resolution layer for the agentic economy',
    description:
      'Competing AI agents resolve verifiable facts. Consensus on-chain. Settlement cross-chain.',
    images: ['/og-placeholder.svg'],
  },
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
