import type { AgentRecord, OnChainSubmission } from '../../lib/contracts';
import { formatSTT, formatWinRate, formatConfidence } from '../../lib/utils/format';
import { formatVerdict } from '../../lib/utils/verdict';
import { Card } from '../ui/Card';
import { AddressDisplay } from '../ui/AddressDisplay';
import { Badge } from '../ui/Badge';

type Props = {
  agent: AgentRecord;
  submission?: OnChainSubmission;
};

export function ResolverCard({ agent, submission }: Props) {
  const { reputation } = agent;
  const winRate = formatWinRate(reputation.resolutionsAttempted, reputation.resolutionsAgreed);

  return (
    <Card className="h-full">
      <div className="mb-4 flex items-start justify-between gap-2">
        <AddressDisplay address={agent.agentAddress} />
        {submission ? <Badge variant="consensus" label="Submitted" /> : <Badge label="Eligible" variant="type" />}
      </div>
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-surface-muted">Bond</dt>
          <dd className="mt-0.5 font-mono text-surface-text">{formatSTT(agent.bond)}</dd>
        </div>
        <div>
          <dt className="text-surface-muted">Win rate</dt>
          <dd className="mt-0.5 font-mono text-cyan">{winRate}</dd>
        </div>
        <div>
          <dt className="text-surface-muted">Attempted</dt>
          <dd className="mt-0.5 font-mono text-surface-text">{reputation.resolutionsAttempted.toString()}</dd>
        </div>
        <div>
          <dt className="text-surface-muted">Earnings</dt>
          <dd className="mt-0.5 font-mono text-surface-text">{formatSTT(reputation.totalEarnings)}</dd>
        </div>
      </dl>
      {submission ? (
        <div className="mt-4 border-t border-white/8 pt-4">
          <p className="text-xs uppercase tracking-widest text-surface-muted">Verdict</p>
          <p className="mt-1 text-sm text-ice">{formatVerdict(submission.verdictHash).label}</p>
          <p className="mt-1 text-xs text-surface-muted">
            Confidence {formatConfidence(submission.confidence)}
          </p>
          {submission.evidenceUri ? (
            <a
              href={submission.evidenceUri}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-cyan hover:underline"
            >
              Evidence link
            </a>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-xs text-surface-muted">Awaiting evaluation…</p>
      )}
    </Card>
  );
}
