'use client';

import Link from 'next/link';
import { useLeaderboard } from '../../lib/hooks/useLeaderboard';
import { formatSTT } from '../../lib/utils/format';
import { AddressDisplay } from '../ui/AddressDisplay';
import { Badge } from '../ui/Badge';
import { LiveIndicator } from '../ui/LiveIndicator';
import { Skeleton } from '../ui/Skeleton';
import { Footer } from '../shared/Footer';
import { Header } from '../shared/Header';
import { Card } from '../ui/Card';

export function LeaderboardView() {
  const { rows, loading, live } = useLeaderboard();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-6 md:py-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-surface-text md:text-4xl">Resolver leaderboard</h1>
            <p className="mt-2 text-sm text-surface-muted">
              Live rankings from ResolverRegistry v4 — bond, win rate, earnings, payout prefs.
            </p>
          </div>
          <LiveIndicator active={live} />
        </div>

        <Card className="overflow-hidden p-0">
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-white/10 bg-navy-elevated/95 backdrop-blur">
                <tr>
                  <th className="px-4 py-3 font-medium text-surface-muted">Rank</th>
                  <th className="px-4 py-3 font-medium text-surface-muted">Agent</th>
                  <th className="px-4 py-3 font-medium text-surface-muted">Operator</th>
                  <th className="px-4 py-3 font-medium text-surface-muted">Bond</th>
                  <th className="px-4 py-3 font-medium text-surface-muted">Attempted</th>
                  <th className="px-4 py-3 font-medium text-surface-muted">Win rate</th>
                  <th className="px-4 py-3 font-medium text-surface-muted">Earnings</th>
                  <th className="px-4 py-3 font-medium text-surface-muted">Tags</th>
                  <th className="px-4 py-3 font-medium text-surface-muted">Payout</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td colSpan={9} className="px-4 py-4">
                        <Skeleton className="h-10" />
                      </td>
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-surface-muted">
                      No registered agents yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.agent} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-4 font-mono text-cyan">{index + 1}</td>
                      <td className="px-4 py-4">
                        <AddressDisplay address={row.agent} chars={4} />
                      </td>
                      <td className="px-4 py-4">
                        <AddressDisplay address={row.operator} chars={4} />
                      </td>
                      <td className="px-4 py-4 font-mono">{formatSTT(row.bond)}</td>
                      <td className="px-4 py-4 font-mono">{row.attempted.toString()}</td>
                      <td className="px-4 py-4 font-mono text-cyan">{row.winRateLabel}</td>
                      <td className="px-4 py-4 font-mono">{formatSTT(row.earnings)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {row.typeTags.slice(0, 2).map((tag) => (
                            <Badge key={tag} label="URL fact" variant="type" />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-surface-muted">{row.payoutLabel}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Link href="/" className="mt-8 inline-block text-sm text-cyan hover:underline">
          ← Marketplace
        </Link>
      </main>
      <Footer />
    </div>
  );
}
