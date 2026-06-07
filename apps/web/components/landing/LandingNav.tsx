'use client';

import Link from 'next/link';
import { demoConfig } from '@oracle-arena/config';
import { LogoMark } from '../shared/LogoMark';
import { SomniaPartnerLockup } from '../shared/SomniaPartnerLockup';

const links = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: `/bounty/${demoConfig.bountyId}`, label: 'Live demo' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/post', label: 'Post bounty' },
];

export function LandingNav() {
  return (
    <nav className="absolute left-0 right-0 top-0 z-20 px-4 py-5 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <LogoMark size="md" variant="landing" className="focus-ring rounded-lg" />
        <div className="hidden items-center gap-6 md:flex">
          <SomniaPartnerLockup size="sm" />
          <div className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="focus-ring rounded-none px-3 py-2 text-sm uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
