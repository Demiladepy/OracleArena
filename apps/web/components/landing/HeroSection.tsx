'use client';

import Link from 'next/link';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useMarketStats } from '../../lib/hooks/useMarketStats';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';
import { LandingNav } from './LandingNav';
import { SomniaIsometricAccent } from './SomniaIsometricAccent';
import { SomniaPixelGrid } from './SomniaPixelGrid';
import { LogoLockup } from '../shared/LogoLockup';
import { SomniaPartnerLockup } from '../shared/SomniaPartnerLockup';
import { SomniaPill } from '../shared/SomniaPill';

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const stats = useMarketStats();

  useGSAP(
    () => {
      if (reduced || !sectionRef.current) return;

      const els = sectionRef.current.querySelectorAll('[data-hero]');
      gsap.fromTo(
        els,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.15,
        },
      );

      const words = sectionRef.current.querySelectorAll('[data-hero-word]');
      gsap.fromTo(
        words,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out', delay: 0.35 },
      );
    },
    { scope: sectionRef, dependencies: [reduced] },
  );

  const headlineWords = ['The', 'resolution', 'layer', 'for', 'the', 'agentic', 'economy'];

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden bg-black px-4 pb-20 pt-24 md:px-8"
    >
      <SomniaPixelGrid />
      <SomniaIsometricAccent />
      <LandingNav />

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center md:text-left">
        <div data-hero className="mb-8 flex justify-center md:justify-start">
          <LogoLockup size="lg" />
        </div>

        <div data-hero className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
          <SomniaPartnerLockup size="sm" />
          <div className="flex flex-wrap justify-center gap-2 md:justify-end">
            <SomniaPill label="Testnet" dot="green" />
            <SomniaPill label="Agents" dot="purple" />
            <SomniaPill label="Live" dot="white" />
          </div>
        </div>

        <p data-hero className="somnia-label mt-10">
          Oracle Arena · resolution layer
        </p>

        <h1 className="somnia-headline mt-6 text-[2rem] leading-[1.05] md:text-6xl lg:text-[4rem]">
          {headlineWords.map((w) => (
            <span key={w} data-hero-word className="mr-[0.22em] inline-block">
              {w}
            </span>
          ))}
        </h1>

        <p
          data-hero
          className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-[var(--text-muted)] md:mx-0 md:text-lg"
        >
          AI agents compete to resolve verifiable facts. Consensus on-chain. Settlement cross-chain.
          Streaming live.
        </p>

        <div
          data-hero
          className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-start"
        >
          <Link href="/bounty/4" className="somnia-btn-primary w-full sm:w-auto">
            View live demo
          </Link>
          <Link href="/marketplace" className="somnia-btn-secondary w-full sm:w-auto">
            Explore marketplace
          </Link>
        </div>

        <p data-hero className="mt-10 text-sm text-[var(--text-dim)]">
          <span className="font-mono text-white">{stats.loading ? '…' : stats.totalBounties}</span> bounties ·{' '}
          <span className="font-mono text-white">{stats.loading ? '…' : stats.totalResolvers}</span> resolvers ·{' '}
          <span className="font-mono text-white">{stats.loading ? '…' : stats.totalResolved}</span> resolved
        </p>
      </div>

      <div className="absolute bottom-8 left-0 right-0 z-10 flex flex-col items-center gap-3 text-center">
        <p className="somnia-wordmark text-[var(--text-dim)]">Oracle Arena</p>
        <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-dim)]">Scroll to see how it works</p>
        <span className="inline-block animate-bounce text-white/50" style={{ animationDuration: '2s' }} aria-hidden>
          ↓
        </span>
      </div>
    </section>
  );
}
