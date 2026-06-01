'use client';

import Link from 'next/link';
import { useBounty, useBountySubmissions } from '../../lib/hooks/useBounty';
import { useRaceTimeline } from '../../lib/hooks/useRaceTimeline';
import { BountyHeader } from '../bounty/BountyHeader';
import { EvidenceSources } from '../bounty/EvidenceSources';
import { RaceTimeline } from '../bounty/RaceTimeline';
import { ResolverCard } from '../bounty/ResolverCard';
import { DisagreementSummary } from '../bounty/DisagreementSummary';
import { VerdictSummary } from '../bounty/VerdictSummary';
import { Footer } from '../shared/Footer';
import { Header } from '../shared/Header';
import { LiveIndicator } from '../ui/LiveIndicator';
import { Skeleton } from '../ui/Skeleton';
import { Badge } from '../ui/Badge';
import { ConsensusStatus } from '../../lib/utils/bounty';

export function BountyRaceView({ bountyId }: { bountyId: bigint }) {
  const { bounty, consensusStatus, loading, error, sdsConnected } = useBounty(bountyId);
  const submissions = useBountySubmissions(bountyId);
  const race = useRaceTimeline(bountyId);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 md:px-6">
          <Skeleton className="mb-8 h-40" />
          <Skeleton className="mb-8 h-64" />
          <Skeleton className="h-96" />
        </main>
      </div>
    );
  }

  if (error || !bounty) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto max-w-3xl flex-1 px-4 py-20 text-center">
          <h1 className="font-display text-2xl text-surface-text">Bounty not found</h1>
          <p className="mt-4 text-surface-muted">{error ?? 'This bounty does not exist on BountyBoard v3.'}</p>
          <Link href="/" className="mt-6 inline-block text-cyan hover:underline">
            ← Back to marketplace
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const submissionByResolver = new Map(
    [...submissions, ...race.submissions].map((s) => [s.resolver.toLowerCase(), s]),
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 md:px-6 md:py-14">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Link href="/" className="text-sm text-surface-muted hover:text-cyan">
            ← Marketplace
          </Link>
          <LiveIndicator active={race.live} />
          {sdsConnected ? <Badge variant="live" label="SDS synced" /> : null}
        </div>

        <BountyHeader bounty={bounty} />

        <div className="mt-10 space-y-8">
          <EvidenceSources sources={bounty.evidenceSources} />
          <RaceTimeline events={race.events} live={race.live} />

          {race.agents.length > 0 ? (
            <section>
              <h2 className="mb-4 font-display text-xl text-surface-text">Resolver agents</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {race.agents.map((agent) => (
                  <ResolverCard
                    key={agent.agentAddress}
                    agent={agent}
                    submission={submissionByResolver.get(agent.agentAddress.toLowerCase())}
                  />
                ))}
              </div>
            </section>
          ) : submissions.length > 0 ? (
            <section>
              <h2 className="mb-4 font-display text-xl text-surface-text">Submissions</h2>
              <p className="text-sm text-surface-muted">
                {submissions.length} submission(s) recorded — resolver registry details loading separately.
              </p>
            </section>
          ) : null}

          {consensusStatus === ConsensusStatus.Disagreed ||
          bounty.status === 3 ? (
            <DisagreementSummary bountyId={bountyId} submissions={[...submissions, ...race.submissions]} />
          ) : (
            <VerdictSummary bounty={bounty} consensusStatus={consensusStatus} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
