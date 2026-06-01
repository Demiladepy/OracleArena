import Link from 'next/link';
import { demoConfig } from '@oracle-arena/config';
import type { OnChainSubmission } from '../../lib/contracts';
import { formatVerdictWithConfidence } from '../../lib/utils/verdict';
import { formatAddress } from '../../lib/utils/format';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

type Props = {
  bountyId: bigint;
  submissions: OnChainSubmission[];
};

export function DisagreementSummary({ bountyId, submissions }: Props) {
  const isLegacyDemo = bountyId === BigInt(demoConfig.legacyDemoBountyId);

  return (
    <Card className="border-l-danger/60">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-xl text-surface-text">Resolution failed</h2>
        <Badge status={3} />
      </div>

      <p className="text-sm leading-relaxed text-surface-muted">
        Agents submitted different verdict hashes. ConsensusEngine marked this bounty{' '}
        <span className="text-danger">Disagreed</span> — escrow refunded to the poster, reputation
        updated with <code className="font-mono text-xs">agreed=false</code> for both resolvers.
      </p>

      {isLegacyDemo ? (
        <p className="mt-4 rounded-xl border border-white/8 bg-navy-deeper/50 p-4 text-sm text-surface-muted">
          <span className="font-medium text-surface-text">Bounty #1 — encoding mismatch, not factual disagreement.</span>{' '}
          Agent A used a raw bytes32 string (&quot;The claim is false.&quot;) while Agent B used a
          different string format. We fixed this by syncing canonical{' '}
          <code className="font-mono text-xs text-cyan">keccak256(&quot;true&quot;)</code> /{' '}
          <code className="font-mono text-xs text-cyan">keccak256(&quot;false&quot;)</code> constants
          before Bounty #4. This record stays on-chain as proof the disagreement path works.
        </p>
      ) : null}

      {submissions.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {submissions.map((sub) => (
            <li
              key={sub.resolver}
              className="rounded-lg border border-white/8 bg-navy-elevated/40 px-4 py-3 text-sm"
            >
              <span className="font-mono text-cyan">{formatAddress(sub.resolver)}</span>
              <p className="mt-1 text-surface-muted">
                {formatVerdictWithConfidence(sub.verdictHash, sub.confidence)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <Link
        href={`/bounty/${demoConfig.bountyId}`}
        className="mt-5 inline-block text-sm text-cyan hover:underline"
      >
        See successful consensus on Bounty #{demoConfig.bountyId.toString()} →
      </Link>
    </Card>
  );
}
