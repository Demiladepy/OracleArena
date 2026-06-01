'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { demoConfig } from '@oracle-arena/config';

const nav = [
  { href: '/', label: 'Marketplace' },
  { href: `/bounty/${demoConfig.bountyId}`, label: 'Demo Race' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/post', label: 'Post Bounty' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-navy/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
        <Link href="/" className="group flex min-w-0 items-center gap-2 md:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan to-ice/80 text-navy-deeper shadow-glow md:h-9 md:w-9">
            <span className="font-display text-base font-bold md:text-lg">O</span>
          </div>
          <div className="min-w-0">
            <span className="block truncate font-display text-base font-semibold text-surface-text transition-colors group-hover:text-cyan md:text-lg">
              Oracle Arena
            </span>
            <span className="hidden text-xs text-surface-muted sm:block">Somnia testnet</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-surface-muted transition-colors hover:bg-white/5 hover:text-cyan"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/10 px-2.5 py-2 text-surface-muted md:hidden"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="block text-lg leading-none">{menuOpen ? '✕' : '☰'}</span>
          </button>
          <div className="[&_button]:!px-2 [&_button]:!py-1.5 [&_button]:!text-xs sm:[&_button]:!px-3 sm:[&_button]:!py-2 sm:[&_button]:!text-sm">
            <ConnectButton
              chainStatus="icon"
              accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
              showBalance={false}
            />
          </div>
        </div>
      </div>

      {menuOpen ? (
        <nav className="border-t border-white/8 px-4 py-3 md:hidden">
          <ul className="flex flex-col gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm text-surface-muted hover:bg-white/5 hover:text-cyan"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
