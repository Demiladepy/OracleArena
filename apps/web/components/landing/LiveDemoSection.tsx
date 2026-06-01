'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { demoConfig } from '@oracle-arena/config';
import { fetchHistoricalRaceEvents } from '../../lib/contracts/raceHistory';
import { fetchBounty, fetchConsensusStatus } from '../../lib/contracts/bountyBoard';
import { formatSTT } from '../../lib/utils/format';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';
import type { RaceEvent } from '../../lib/hooks/useRaceTimeline';

gsap.registerPlugin(ScrollTrigger);

const KIND_ORDER: RaceEvent['kind'][] = [
  'posted',
  'submission',
  'consensus',
  'settlement',
  'bridge',
];

function pickTimelineEvents(events: RaceEvent[]): RaceEvent[] {
  const picked: RaceEvent[] = [];
  const posted = events.find((e) => e.kind === 'posted');
  if (posted) picked.push(posted);

  const subs = events.filter((e) => e.kind === 'submission').slice(0, 2);
  picked.push(...subs);

  for (const kind of ['consensus', 'settlement', 'bridge'] as const) {
    const ev = events.find((e) => e.kind === kind);
    if (ev) picked.push(ev);
  }

  return picked.length >= 3
    ? picked
  : events.filter((e) => KIND_ORDER.includes(e.kind)).slice(0, 6);
}

export function LiveDemoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [events, setEvents] = useState<RaceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const id = BigInt(demoConfig.bountyId);
        const [status, bounty] = await Promise.all([
          fetchConsensusStatus(id),
          fetchBounty(id),
        ]);
        const historical = await fetchHistoricalRaceEvents(id, status);
        const withPosted: RaceEvent[] = [
          {
            id: 'posted-demo',
            kind: 'posted',
            label: 'Bounty posted',
            detail: `${formatSTT(bounty.displayPayout)} · ${bounty.claim.slice(0, 50)}`,
            timestamp: bounty.createdAt,
          },
          ...historical,
        ];
        setEvents(pickTimelineEvents(withPosted));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useGSAP(
    () => {
      if (reduced || !sectionRef.current) return;
      const dots = sectionRef.current.querySelectorAll('[data-demo-event]');
      gsap.fromTo(
        dots,
        { opacity: 0, x: -24 },
        {
          opacity: 1,
          x: 0,
          duration: 0.45,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' },
        },
      );
    },
    { scope: sectionRef, dependencies: [reduced, events.length] },
  );

  return (
    <section ref={sectionRef} className="border-t border-white/8 px-4 py-28 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-4xl font-bold text-[var(--text)] md:text-5xl">
          See it running.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-[var(--text-muted)]">
          Bounty #4 settled on Somnia testnet across two resolver agents. Real LLM inference. Real
          consensus. Real cross-chain payout.
        </p>

        <div className="mt-14 overflow-x-auto pb-4">
          <div className="flex min-w-[640px] items-start gap-0">
            {loading ? (
              <p className="text-sm text-[var(--text-muted)]">Loading on-chain timeline…</p>
            ) : (
              events.map((ev, i) => (
                <div key={ev.id} data-demo-event className="relative flex flex-1 flex-col items-center px-2">
                  {i > 0 ? (
                    <div
                      className="absolute left-0 top-3 h-px w-full -translate-x-1/2 bg-cyan/30"
                      aria-hidden
                    />
                  ) : null}
                  <div className="relative z-10 h-3 w-3 rounded-full bg-cyan shadow-[0_0_12px_var(--accent-glow)]" />
                  <p className="mt-4 text-center text-xs font-medium text-[var(--text)]">{ev.label}</p>
                  {ev.detail ? (
                    <p className="mt-1 max-w-[140px] text-center text-[10px] leading-snug text-[var(--text-dim)]">
                      {ev.detail.slice(0, 80)}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-12 text-center md:text-left">
          <Link
            href={`/bounty/${demoConfig.bountyId}`}
            className="focus-ring neon-glow inline-block rounded-xl bg-cyan px-10 py-4 text-lg font-semibold text-[var(--bg-base)] transition-transform hover:scale-[1.02]"
          >
            View the full race →
          </Link>
        </div>
      </div>
    </section>
  );
}
