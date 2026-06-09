'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';
import { killSectionScrollTriggers, revealOnScroll } from '../../lib/gsap/landingScroll';

gsap.registerPlugin(ScrollTrigger);

const primitives = [
  {
    n: '01',
    name: 'Somnia Agents',
    role: 'Verifiable AI inference',
    desc: 'Resolver agents decide, gather evidence, and produce verdicts inside validator consensus via inferToolsChat.',
  },
  {
    n: '02',
    name: 'Native Reactivity',
    role: 'No backend, no keepers',
    desc: 'Agents wake the instant a relevant bounty is posted. The chain is the backend.',
  },
  {
    n: '03',
    name: 'Data Streams (SDS)',
    role: 'Live structured output',
    desc: 'Leaderboards, race views, and receipts stream live via the SDS SDK for any app to consume.',
  },
  {
    n: '04',
    name: 'LI.FI Integration',
    role: 'Cross-chain settlement',
    desc: 'Resolvers paid on any chain, any asset. Resolution becomes EVM-wide infrastructure.',
  },
  {
    n: '05',
    name: 'Sub-second finality',
    role: 'Per-decision economics',
    desc: 'Per-tick reputation updates and micro-bounties viable. Cost-prohibitive on any other chain.',
  },
];

export function PrimitivesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || !sectionRef.current) return;

      const rows = sectionRef.current.querySelectorAll('[data-primitive-row]');
      rows.forEach((row) => {
        const num = row.querySelector('[data-primitive-num]');
        const text = row.querySelector('[data-primitive-text]');
        gsap.fromTo(
          num,
          { opacity: 0, x: -28 },
          {
            opacity: 1,
            x: 0,
            duration: 0.45,
            ease: 'power2.out',
            scrollTrigger: { trigger: row, start: 'top 88%', once: true },
          },
        );
        gsap.fromTo(
          text,
          { opacity: 0, x: 20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.45,
            ease: 'power2.out',
            scrollTrigger: { trigger: row, start: 'top 88%', once: true },
          },
        );
      });

      revealOnScroll(
        sectionRef.current.querySelector('[data-primitives-heading]'),
        sectionRef.current,
        { start: 'top 82%', y: 20 },
      );

      return () => killSectionScrollTriggers(sectionRef.current);
    },
    { scope: sectionRef, dependencies: [reduced] },
  );

  return (
    <section ref={sectionRef} className="border-t border-white/10 bg-black px-4 py-28 md:px-8">
      <div className="mx-auto max-w-4xl">
        <h2 data-primitives-heading className="somnia-headline text-3xl md:text-4xl">
          Five Somnia primitives. One product.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-[var(--text-muted)]">
          Oracle Arena exists because of Somnia. Each primitive is load-bearing — remove any one and
          the product breaks.
        </p>

        <div className="mt-16 space-y-12">
          {primitives.map((p) => (
            <div
              key={p.n}
              data-primitive-row
              className="border-b border-white/8 pb-12 last:border-0"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-10">
                <span
                  data-primitive-num
                  className="font-mono text-5xl font-semibold text-purple-accent md:w-24 md:shrink-0"
                >
                  {p.n}
                </span>
                <div data-primitive-text className="min-w-0 flex-1">
                  <p className="font-display text-xl font-semibold text-[var(--text)]">
                    {p.name}
                    <span className="ml-2 text-base font-normal text-[var(--text-muted)]">
                      — {p.role}
                    </span>
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
