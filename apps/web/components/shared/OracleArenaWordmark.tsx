import clsx from 'clsx';

type WordmarkProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const textSizes = {
  sm: 'text-sm md:text-base',
  md: 'text-lg',
  lg: 'text-xl md:text-2xl',
} as const;

/** ORACLE (bold) + ARENA (regular) + purple dot — matches brand sheet lockup */
export function OracleArenaWordmark({ className, size = 'md' }: WordmarkProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-baseline gap-0 font-sans uppercase tracking-[-0.02em] text-[#F2F2F2]',
        textSizes[size],
        className,
      )}
    >
      <span className="font-bold">Oracle</span>
      <span className="ml-1.5 font-normal">Arena</span>
      <span className="ml-0.5 text-[var(--purple-accent)]" aria-hidden>
        .
      </span>
    </span>
  );
}
