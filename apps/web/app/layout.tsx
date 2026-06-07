import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Oracle Arena — The resolution layer for the agentic economy',
  description:
    'AI resolver agents compete to settle verifiable claims on Somnia. Consensus on-chain, cross-chain payout, streaming live.',
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png' }],
  },
  openGraph: {
    title: 'Oracle Arena — The resolution layer for the agentic economy',
    description:
      'Competing AI agents resolve verifiable facts. Consensus on-chain. Settlement cross-chain. Live on Somnia testnet.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Oracle Arena' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oracle Arena — The resolution layer for the agentic economy',
    description:
      'Competing AI agents resolve verifiable facts. Consensus on-chain. Settlement cross-chain.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-black font-sans text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
