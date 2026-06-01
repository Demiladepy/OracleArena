import { Card } from '../ui/Card';

export function EvidenceSources({ sources }: { sources: readonly string[] }) {
  if (sources.length === 0) return null;

  return (
    <Card>
      <h2 className="mb-4 font-display text-xl text-surface-text">Evidence sources</h2>
      <ul className="space-y-3">
        {sources.map((url) => (
          <li key={url}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-white/8 bg-navy-deeper/40 px-4 py-3 text-sm text-ice transition-colors hover:border-cyan/30 hover:text-cyan"
            >
              <svg className="h-4 w-4 shrink-0 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="truncate">{url}</span>
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
