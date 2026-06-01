'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { RaceEvent } from '../../lib/hooks/useRaceTimeline';
import { Card } from '../ui/Card';
import { LiveIndicator } from '../ui/LiveIndicator';
import { formatTimeAgo } from '../../lib/utils/time';

const kindColors: Record<RaceEvent['kind'], string> = {
  posted: 'border-cyan/40 bg-cyan/5',
  agents_notified: 'border-ice/30 bg-ice/5',
  submission: 'border-warning/30 bg-warning/5',
  consensus: 'border-success/40 bg-success/10',
  consensus_failed: 'border-danger/40 bg-danger/10',
  settlement: 'border-success/30 bg-success/5',
  payout_queued: 'border-cyan/30 bg-cyan/5',
  payout_forwarded: 'border-ice/30 bg-ice/5',
  bridge: 'border-cyan/40 bg-cyan/10',
};

export function RaceTimeline({ events, live }: { events: RaceEvent[]; live: boolean }) {
  return (
    <Card>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl text-surface-text">Resolution race</h2>
        <LiveIndicator active={live} />
      </div>
      <div className="relative space-y-0">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/10" />
        <AnimatePresence initial={false}>
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.03 }}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              <div className="relative z-10 mt-1.5 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-cyan/50 bg-navy shadow-glow" />
              <div className={`min-w-0 flex-1 rounded-xl border px-4 py-3 ${kindColors[event.kind]}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-surface-text">{event.label}</p>
                  {event.timestamp > 0n ? (
                    <span className="shrink-0 text-[10px] uppercase tracking-wider text-surface-muted">
                      {formatTimeAgo(event.timestamp)}
                    </span>
                  ) : null}
                </div>
                {event.detail ? (
                  <p className="mt-1 text-xs leading-relaxed text-surface-muted">{event.detail}</p>
                ) : null}
                {event.meta?.evidenceUri ? (
                  <a
                    href={event.meta.evidenceUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-cyan hover:underline"
                  >
                    View evidence →
                  </a>
                ) : null}
                {event.meta?.explorer ? (
                  <a
                    href={event.meta.explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 ml-3 inline-block text-xs text-surface-muted hover:text-cyan hover:underline"
                  >
                    Shannon tx ↗
                  </a>
                ) : null}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {events.length === 0 ? (
          <p className="py-6 text-center text-sm text-surface-muted">Loading race timeline…</p>
        ) : null}
      </div>
    </Card>
  );
}
