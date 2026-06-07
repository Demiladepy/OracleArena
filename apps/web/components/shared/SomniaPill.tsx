import clsx from 'clsx';

const dotColors = {
  white: 'bg-[#F2F2F2]',
  purple: 'bg-[#7c3aed]',
  green: 'bg-[#22c55e]',
  pink: 'bg-[#ec4899]',
  cyan: 'bg-[#22d3ee]',
  muted: 'bg-[#737373]',
} as const;

type DotColor = keyof typeof dotColors;

type Props = {
  label: string;
  dot?: DotColor;
  className?: string;
};

/** Somnia-style capsule label — thin white border, status dot, white text */
export function SomniaPill({ label, dot = 'white', className }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border border-white/35 bg-black/40 px-3 py-1.5 text-xs font-medium tracking-wide text-[#F2F2F2] backdrop-blur-sm',
        className,
      )}
    >
      <span className={clsx('h-2 w-2 shrink-0 rounded-full', dotColors[dot])} aria-hidden />
      {label}
    </span>
  );
}
