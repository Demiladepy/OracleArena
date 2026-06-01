'use client';

import { useState } from 'react';
import type { Address } from 'viem';
import { cn, formatAddress } from '../../lib/utils/format';

type AddressDisplayProps = {
  address: Address | string;
  chars?: number;
  className?: string;
  /** When false, no explorer link — use inside Link cards to avoid nested anchors */
  showExplorerLink?: boolean;
};

export function AddressDisplay({
  address,
  chars = 4,
  className,
  showExplorerLink = false,
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);
  const formatted = formatAddress(address, chars);

  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <span
      className={cn(
        'group inline-flex items-center gap-1.5 font-mono text-sm text-ice',
        className,
      )}
      title={address}
    >
      <span className="inline-block h-5 w-5 shrink-0 rounded-full bg-gradient-to-br from-cyan/40 to-ice/20" />
      <span>{formatted}</span>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 text-[10px] uppercase tracking-wider text-surface-muted hover:text-cyan"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      {showExplorerLink ? (
        <a
          href={`https://shannon-explorer.somnia.network/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] uppercase tracking-wider text-surface-muted hover:text-cyan"
        >
          Explorer ↗
        </a>
      ) : null}
    </span>
  );
}
