'use client';

import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { http } from 'viem';
import { somniaChain, RPC_URL } from '../lib/chains';

const rawProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() ?? '';
const PLACEHOLDER = '00000000000000000000000000000000';
const projectId =
  rawProjectId && rawProjectId !== PLACEHOLDER ? rawProjectId : PLACEHOLDER;

const config = getDefaultConfig({
  appName: 'Oracle Arena',
  projectId,
  chains: [somniaChain],
  transports: {
    [somniaChain.id]: http(RPC_URL),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#5EEAD4',
            accentColorForeground: '#060B22',
            borderRadius: 'medium',
            overlayBlur: 'small',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
