'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

const cards = [
  {
    title: 'Centralized oracles',
    body: 'One service, one signature. The whole trustless contract leans on a trusted middleman.',
  },
  {
    title: 'Human arbitration',
    body: 'Manual dispute committees, weeks of delay, no on-chain audit trail of the reasoning.',
  },
  {
    title: 'Single-agent AI',
    body: 'One LLM on one server. Manipulable, opaque, and impossible for strangers to trust.',
  },
];

export function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || !sectionRef.current) return;

      const heading = sectionRef.current.querySelector('[data-problem-heading]');
      const cardEls = sectionRef.current.querySelectorAll('[data-problem-card]');

      gsap.fromTo(
        heading,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
        },
      );

      gsap.fromTo(
        cardEls,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 65%' },
        },
      );
    },
    { scope: sectionRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={sectionRef}
      className="flex min-h-screen flex-col justify-center border-t border-white/10 bg-black px-4 py-24 md:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          data-problem-heading
          className="max-w-3xl somnia-headline text-3xl leading-tight md:text-[2.5rem]"
        >
          AI agents can act. Nobody trusts them when money&apos;s on the line.
        </h2>
        <p className="mt-5 max-w-prose text-lg text-[var(--text-muted)]">
          Today&apos;s resolution depends on centralized arbiters or trusted oracles. Both break the
          trust model crypto exists to fix.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {cards.map((c) => (
            <article
              key={c.title}
              data-problem-card
              className="somnia-card p-6 pl-5"
              style={{ borderLeftWidth: 3, borderLeftColor: 'var(--purple-accent)' }}
            >
              <h3 className="somnia-headline text-xl">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{c.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
