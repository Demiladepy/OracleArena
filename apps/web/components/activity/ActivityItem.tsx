import Link from 'next/link';
import type { ActivityItem } from '../../lib/hooks/useActivityFeed';

const icons: Record<ActivityItem['type'], string> = {
  bounty_posted: '◆',
  consensus_reached: '✓',
  agent_registered: '◎',
  bounty_cancelled: '×',
  submission: '→',
};

export function ActivityItemRow({ item }: { item: ActivityItem }) {
  const inner = (
    <div className="flex gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/5">
      <span className="mt-0.5 text-cyan">{icons[item.type]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-surface-text">{item.title}</p>
        <p className="truncate text-xs text-surface-muted">{item.detail}</p>
      </div>
    </div>
  );

  if (item.href) {
    return <Link href={item.href}>{inner}</Link>;
  }

  return inner;
}
