import type { OnChainBounty } from '../../lib/contracts';
import { ConsensusStatus, ConsensusStatusLabel } from '../../lib/utils/bounty';
import { formatSTT } from '../../lib/utils/format';
import { formatVerdict } from '../../lib/utils/verdict';
import { Card } from '../ui/Card';
import { AddressDisplay } from '../ui/AddressDisplay';
import { Badge } from '../ui/Badge';

type Props = {
  bounty: OnChainBounty;
  consensusStatus: number;
  winners?: readonly `0x${string}`[];
  shares?: readonly bigint[];
  feeAmount?: bigint;
};

export function VerdictSummary({ bounty, consensusStatus, winners, shares, feeAmount }: Props) {
  const resolved = bounty.status === 2 || consensusStatus === ConsensusStatus.Agreed;
  const failed =
    consensusStatus === ConsensusStatus.Disagreed || consensusStatus === ConsensusStatus.Unresolved;

  if (!resolved && !failed && bounty.status !== 3) {
    return (
      <Card accent>
        <h2 className="font-display text-xl text-surface-text">Verdict summary</h2>
        <p className="mt-3 text-sm text-surface-muted">
          Consensus pending — waiting for resolver submissions and agreement.
        </p>
        <p className="mt-2 text-xs text-surface-muted">
          Status: {ConsensusStatusLabel[consensusStatus as keyof typeof ConsensusStatusLabel] ?? 'Pending'}
        </p>
      </Card>
    );
  }

  return (
    <Card accent className="border-l-success/60">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-xl text-surface-text">Verdict summary</h2>
        {resolved ? <Badge variant="consensus" label="Resolved" /> : <Badge status={3} />}
      </div>

      {bounty.winningVerdictHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? (
        <p className="text-sm text-cyan">{formatVerdict(bounty.winningVerdictHash).label}</p>
      ) : null}

      {winners && winners.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs uppercase tracking-widest text-surface-muted">Winners</p>
          {winners.map((winner, i) => (
            <div key={winner} className="flex items-center justify-between gap-2 text-sm">
              <AddressDisplay address={winner} />
              {shares?.[i] !== undefined ? (
                <span className="font-mono text-success">{formatSTT(shares[i])}</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {feeAmount !== undefined ? (
        <p className="mt-4 text-xs text-surface-muted">Protocol fee: {formatSTT(feeAmount)}</p>
      ) : null}

      {failed ? (
        <p className="mt-3 text-sm text-danger">
          {ConsensusStatusLabel[consensusStatus as keyof typeof ConsensusStatusLabel]} — bounty marked unresolved.
        </p>
      ) : null}
    </Card>
  );
}
