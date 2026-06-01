'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityItem } from '../../lib/hooks/useActivityFeed';
import { Card } from '../ui/Card';
import { LiveIndicator } from '../ui/LiveIndicator';
import { Skeleton } from '../ui/Skeleton';
import { ActivityItemRow } from './ActivityItem';

export function ActivityFeed({
  items,
  live,
  loading,
}: {
  items: ActivityItem[];
  live: boolean;
  loading?: boolean;
}) {
  return (
    <Card>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-xl text-surface-text">Live activity</h2>
        <LiveIndicator active={live} />
      </div>
      <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-surface-muted">
                No recent activity. Post a bounty to get started.
              </p>
            ) : (
              items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <ActivityItemRow item={item} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </div>
    </Card>
  );
}
