'use client';

import { useSystemStatus } from '../../lib/hooks/useSystemStatus';
import type { SdsPublisherStatus } from '../../lib/systemStatus';

function StatusDot({ tone }: { tone: 'ok' | 'warn' | 'muted' }) {
  const colors = {
    ok: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]',
    warn: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]',
    muted: 'bg-white/30',
  };
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${colors[tone]}`} aria-hidden />;
}

function sdsLabel(status: SdsPublisherStatus): string {
  if (status === 'checking') return 'SDS checking…';
  if (status === 'live') return 'SDS live';
  return 'SDS paused';
}

export function LiveSystemStatus() {
  const status = useSystemStatus();

  const contractsTone = status.loading ? 'muted' : status.contractsOk ? 'ok' : 'warn';
  const sdsTone =
    status.sdsStatus === 'live' ? 'ok' : status.sdsStatus === 'paused' ? 'warn' : 'muted';

  return (
    <div
      data-hero
      className="mt-8 inline-flex w-full max-w-xl flex-col gap-2 rounded-none border border-white/10 bg-black/40 px-4 py-3 text-left backdrop-blur-sm md:w-auto"
      aria-label="Live system status"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">
        Live system status
      </p>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] text-[var(--text-muted)]">
        <li className="flex items-center gap-2">
          <StatusDot tone={contractsTone} />
          <span>
            Contracts{' '}
            {status.loading ? '…' : `${status.contractsDeployed}/${status.contractsTotal}`}
            {!status.loading && status.contractsOk ? (
              <span className="text-emerald-300"> ✓</span>
            ) : null}
          </span>
        </li>
        <li className="flex items-center gap-2">
          <StatusDot tone={sdsTone} />
          <span>{sdsLabel(status.sdsStatus)}</span>
        </li>
        <li className="flex items-center gap-2">
          <StatusDot tone="ok" />
          <span>
            Tests {status.testsPassing}/{status.testsTotal}
            <span className="text-emerald-300"> ✓</span>
          </span>
        </li>
      </ul>
      <p className="text-[10px] leading-relaxed text-[var(--text-dim)]">
        Contracts verified on Somnia 50312 · SDS from publisher stream counts · tests from CI (
        <code className="text-white/50">forge test</code>)
      </p>
    </div>
  );
}
