'use client';

import Link from 'next/link';
import { useState } from 'react';
import { deployedAddresses } from '@oracle-arena/config';
import { demoConfig } from '@oracle-arena/config';

const contracts = [
  { label: 'BountyBoard v3', address: deployedAddresses.bountyBoard },
  { label: 'ConsensusEngine v2', address: deployedAddresses.consensusEngine },
  { label: 'Settlement', address: deployedAddresses.settlement },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/8 bg-[var(--bg-base)] px-4 py-16 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-3">
        <div>
          <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan to-accent-bright font-display font-bold text-[var(--bg-base)]">
              O
            </div>
            <span className="font-display text-lg font-semibold text-[var(--text)]">Oracle Arena</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">
            Open infrastructure for verifiable fact resolution on Somnia.
          </p>
          <p className="mt-2 text-sm font-medium text-cyan">Live on Somnia testnet</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-dim)]">
            Quick links
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/marketplace" className="text-[var(--text-muted)] hover:text-cyan">
                Marketplace
              </Link>
            </li>
            <li>
              <Link href={`/bounty/${demoConfig.bountyId}`} className="text-[var(--text-muted)] hover:text-cyan">
                Live demo
              </Link>
            </li>
            <li>
              <Link href="/leaderboard" className="text-[var(--text-muted)] hover:text-cyan">
                Leaderboard
              </Link>
            </li>
            <li>
              <Link href="/post" className="text-[var(--text-muted)] hover:text-cyan">
                Post a bounty
              </Link>
            </li>
            <li>
              <Link
                href="https://github.com/nibiru/oraclearena"
                className="text-[var(--text-muted)] hover:text-cyan"
              >
                GitHub
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-dim)]">
            Contracts
          </p>
          <ul className="mt-4 space-y-3">
            {contracts.map((c) => (
              <ContractRow key={c.label} label={c.label} address={c.address} />
            ))}
          </ul>
        </div>
      </div>

      <p className="mx-auto mt-14 max-w-6xl border-t border-white/6 pt-8 text-center text-xs text-[var(--text-dim)] md:text-left">
        Built solo for the Somnia Agentathon · June 2026
      </p>
    </footer>
  );
}

function ContractRow({ label, address }: { label: string; address: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <li>
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(address);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="focus-ring mt-0.5 w-full truncate rounded font-mono text-left text-[11px] text-cyan hover:underline"
      >
        {copied ? 'Copied' : address}
      </button>
    </li>
  );
}
