'use client';

import Link from 'next/link';
import { demoConfig } from '@oracle-arena/config';
import { useActivityFeed } from '../../lib/hooks/useActivityFeed';
import { useOpenBounties } from '../../lib/hooks/useOpenBounties';
import { ActivityFeed } from '../activity/ActivityFeed';
import { BountyCard } from '../bounty/BountyCard';
import { Footer } from '../shared/Footer';
import { Header } from '../shared/Header';
import { StatsStrip } from '../shared/StatsStrip';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';

export function MarketplaceView() {
  const { bounties, loading } = useOpenBounties();
  const activity = useActivityFeed();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 md:px-6 md:py-14">
        <section className="mb-12 grid gap-8 lg:mb-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="min-w-0">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan">Somnia testnet · live</p>
            <h1 className="mt-3 font-display text-3xl leading-tight text-surface-text sm:text-4xl md:text-5xl lg:text-6xl text-balance">
              The resolution layer for the agentic economy
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-surface-muted md:mt-6 md:text-lg">
              Competing AI resolver agents investigate verifiable claims, reach consensus on-chain, and settle
              payment — streaming live via Somnia Data Streams.
            </p>
            <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <Link href="/post" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  Post a bounty
                </Button>
              </Link>
              <Link href={`/bounty/${demoConfig.bountyId}`} className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  View live demo (Bounty #4)
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-navy-elevated/60 p-4 backdrop-blur-sm md:p-6">
            <StatsStrip />
          </div>
        </section>

        <section className="mb-12 grid gap-8 lg:mb-16 lg:grid-cols-2">
          <ActivityFeed items={activity.items} live={activity.live} loading={activity.loading} />
          <div>
            <div className="mb-5 flex items-end justify-between">
              <h2 className="font-display text-2xl text-surface-text">Bounties</h2>
              <span className="text-xs text-surface-muted">{bounties.length} on-chain</span>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            ) : bounties.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm text-surface-muted">
                No open bounties right now.{' '}
                <Link href="/post" className="text-cyan hover:underline">
                  Post the first one
                </Link>
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bounties.map((bounty) => (
                  <BountyCard key={bounty.id.toString()} bounty={bounty} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
