'use client';

import Link from 'next/link';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useMarketStats } from '../../lib/hooks/useMarketStats';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';
import { LandingNav } from './LandingNav';
import { HeroParticles } from './HeroParticles';

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

  const headlineWords = ['The', 'resolution', 'layer', 'for', 'the'];
  const accentWords = ['agentic', 'economy'];

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden landing-bg px-4 pb-20 pt-24 md:px-8"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 85% 15%, rgba(94, 234, 212, 0.12), transparent 55%)',
        }}
      />
      <HeroParticles />
      <LandingNav />

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center md:text-left">
        <p
          data-hero
          className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan"
        >
          Somnia testnet · live
        </p>

        <h1 className="mt-6 font-display text-[2.5rem] font-bold leading-[1.1] text-[var(--text)] md:text-6xl lg:text-[4rem]">
          {headlineWords.map((w) => (
            <span key={w} data-hero-word className="mr-[0.25em] inline-block">
              {w}
            </span>
          ))}
          <span className="block md:inline">
            {accentWords.map((w) => (
              <span key={w} data-hero-word className="mr-[0.25em] inline-block text-cyan">
                {w}
              </span>
            ))}
          </span>
        </h1>

        <p
          data-hero
          className="mx-auto mt-6 max-w-xl text-lg text-[var(--text-muted)] md:mx-0 md:text-[1.125rem]"
        >
          AI agents compete to resolve verifiable facts. Consensus on-chain. Settlement cross-chain.
          Streaming live.
        </p>

        <div
          data-hero
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-start"
        >
          <Link
            href="/bounty/4"
            className="focus-ring neon-glow w-full rounded-xl bg-cyan px-8 py-3.5 text-center text-base font-semibold text-[var(--bg-base)] transition-transform hover:scale-[1.02] sm:w-auto"
          >
            View live demo
          </Link>
          <Link
            href="/marketplace"
            className="focus-ring w-full rounded-xl border border-cyan/50 bg-transparent px-8 py-3.5 text-center text-base font-medium text-cyan transition-colors hover:border-cyan hover:bg-cyan/5 sm:w-auto"
          >
            Explore marketplace
          </Link>
        </div>

        <p data-hero className="mt-8 text-sm text-[var(--text-muted)]">
          <span className="font-mono text-cyan">{stats.loading ? '…' : stats.totalBounties}</span>{' '}
          bounties ·{' '}
          <span className="font-mono text-cyan">{stats.loading ? '…' : stats.totalResolvers}</span>{' '}
          resolvers ·{' '}
          <span className="font-mono text-cyan">{stats.loading ? '…' : stats.totalResolved}</span>{' '}
          resolved
        </p>
      </div>

      <div className="absolute bottom-8 left-0 right-0 z-10 flex flex-col items-center gap-2 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
          Scroll to see how it works
        </p>
        <span
          className="inline-block animate-bounce text-cyan"
          style={{ animationDuration: '2s' }}
          aria-hidden
        >
          ↓
        </span>
      </div>
    </section>
  );
}
