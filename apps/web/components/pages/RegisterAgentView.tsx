'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { isAddress } from 'viem';
import { waitForTransactionReceipt } from 'viem/actions';
import { deployedAddresses } from '@oracle-arena/config';
import { estimateContractGasWithFallback, GAS_FALLBACK } from '../../lib/gas';
import { publicClient } from '../../lib/viem';
import { addresses, resolverRegistryAbi } from '../../lib/contracts';
import { fetchUrlResolvableFactType } from '../../lib/contracts/bountyBoard';
import { formatSTT } from '../../lib/utils/format';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Footer } from '../shared/Footer';
import { Header } from '../shared/Header';

type Banner = { kind: 'info' | 'error' | 'success'; message: string };

export function RegisterAgentView() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { writeContractAsync, isPending } = useWriteContract();

  const [agentAddress, setAgentAddress] = useState('');
  const [typeTag, setTypeTag] = useState<`0x${string}` | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: minBondOnChain } = useReadContract({
    address: addresses.resolverRegistry,
    abi: resolverRegistryAbi,
    functionName: 'MIN_BOND',
  });

  const minBond = minBondOnChain ?? 1n * 10n ** 18n;

  useEffect(() => {
    fetchUrlResolvableFactType().then(setTypeTag).catch(() => setTypeTag(null));
  }, []);

  const agentValid = isAddress(agentAddress);
  const bondLabel = formatSTT(minBond);

  const formValid = agentValid && typeTag !== null;

  const handleRegister = useCallback(async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    if (!formValid || !typeTag) return;

    setSubmitting(true);
    setBanner(null);

    try {
      const gas = await estimateContractGasWithFallback(
        publicClient,
        {
          address: addresses.resolverRegistry,
          abi: resolverRegistryAbi,
          functionName: 'registerAgent',
          args: [agentAddress as `0x${string}`, [typeTag]],
          account: address!,
          value: minBond,
        },
        GAS_FALLBACK.registerAgent,
      );
      const hash = await writeContractAsync({
        address: addresses.resolverRegistry,
        abi: resolverRegistryAbi,
        functionName: 'registerAgent',
        args: [agentAddress as `0x${string}`, [typeTag]],
        value: minBond,
        gas,
      });

      await waitForTransactionReceipt(publicClient, { hash });
      setBanner({
        kind: 'success',
        message: `Agent registered. Bond locked: ${bondLabel}. Agents must call evaluateBounty when bounties are posted.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setBanner({ kind: 'error', message });
    } finally {
      setSubmitting(false);
    }
  }, [address, agentAddress, bondLabel, formValid, isConnected, minBond, openConnectModal, typeTag, writeContractAsync]);

  const templateAgent = addresses.communityResolverTemplate;

  const deploySteps = useMemo(
    () => [
      'Deploy a ResolverAgent contract pointing at the live BountyBoard, Registry, and ConsensusEngine addresses.',
      'Set AGENT_OPERATOR to your wallet — only that address can call evaluateBounty on the agent.',
      'Fund the agent with STT for inferToolsChat calls (~0.07 STT per evaluation).',
      'Register the agent here with a bond (testnet: 1 STT; production target: 50 STT).',
      'Set payout preferences via ResolverPayoutPrefs if cross-chain settlement is required.',
    ],
    [],
  );

  const deployCommand = useMemo(
    () =>
      `cd contracts\n.\\deploy-community-resolver-testnet.ps1 -Operator <your-wallet>`,
    [],
  );

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-6">
        <div className="mb-8">
          <p className="somnia-label">Phase 2</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-surface-text md:text-4xl">
            Register a resolver agent
          </h1>
          <p className="mt-3 max-w-2xl text-surface-muted">
            Open registration is live on Somnia testnet. Deploy your ResolverAgent, then bond STT and tag it for{' '}
            <code className="text-cyan">URL_RESOLVABLE_FACT</code> bounties.
          </p>
        </div>

        {banner ? (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              banner.kind === 'error'
                ? 'border-red-500/30 bg-red-500/10 text-red-200'
                : banner.kind === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-cyan/20 bg-cyan/5 text-surface-muted'
            }`}
          >
            {banner.message}
          </div>
        ) : null}

        <Card className="mb-8 space-y-6 p-6">
          {templateAgent ? (
            <div className="rounded-lg border border-cyan/20 bg-cyan/5 p-4 text-sm">
              <p className="font-medium text-surface-text">Community template (deployed, not registered)</p>
              <p className="mt-1 font-mono text-xs text-cyan break-all">{templateAgent}</p>
              <p className="mt-2 text-surface-muted">
                Operator is your connected wallet. After you register, this agent appears on the leaderboard.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                onClick={() => setAgentAddress(templateAgent)}
              >
                Use community template
              </Button>
            </div>
          ) : null}

          <div>
            <label htmlFor="agent" className="mb-2 block text-sm font-medium text-surface-text">
              ResolverAgent contract address
            </label>
            <input
              id="agent"
              value={agentAddress}
              onChange={(e) => setAgentAddress(e.target.value.trim())}
              placeholder="0x…"
              className="w-full rounded-none border border-white/10 bg-[var(--bg-card)] px-4 py-3 font-mono text-sm text-surface-text outline-none focus:border-white/40"
            />
          </div>

          <div className="rounded-lg border border-white/8 bg-white/5 p-4 text-sm text-surface-muted">
            <p>
              <span className="text-surface-text">Minimum bond:</span> {bondLabel}
              {minBondOnChain ? null : ' (config fallback)'}
            </p>
            <p className="mt-1">
              <span className="text-surface-text">Type tag:</span>{' '}
              {typeTag ? `${typeTag.slice(0, 10)}…` : 'Loading…'}
            </p>
            <p className="mt-1">
              <span className="text-surface-text">Operator:</span> {isConnected ? 'Your connected wallet' : 'Connect wallet'}
            </p>
          </div>

          <Button
            type="button"
            disabled={!formValid || submitting || isPending}
            onClick={() => void handleRegister()}
            className="w-full"
          >
            {submitting || isPending ? 'Registering…' : `Register & bond ${bondLabel}`}
          </Button>
        </Card>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-surface-text">Operator checklist</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-surface-muted">
            {deploySteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="text-sm text-surface-muted">
            Deploy your own agent:{' '}
            <code className="text-cyan">contracts/deploy-community-resolver-testnet.ps1</code>
          </p>
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/60 p-3 text-xs text-surface-muted">
            {deployCommand}
          </pre>
          <p className="text-sm text-surface-muted">
            Registered agents appear on the{' '}
            <Link href="/leaderboard" className="text-cyan hover:underline">
              leaderboard
            </Link>
            .
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
