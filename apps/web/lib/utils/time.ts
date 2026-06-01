/** Relative time for timeline / activity (no extra deps) */
export function formatTimeAgo(timestamp: bigint | number): string {
  const sec = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
  if (sec <= 0) return 'Recently';

  const diffMs = Date.now() - sec * 1000;
  if (diffMs < 0) return 'Just now';

  const secAgo = Math.floor(diffMs / 1000);
  if (secAgo < 60) return 'Just now';
  if (secAgo < 3600) return `${Math.floor(secAgo / 60)} min ago`;
  if (secAgo < 86400) return `${Math.floor(secAgo / 3600)}h ago`;
  if (secAgo < 86400 * 7) return `${Math.floor(secAgo / 86400)}d ago`;

  return new Date(sec * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
