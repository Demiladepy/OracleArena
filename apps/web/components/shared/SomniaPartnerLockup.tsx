import clsx from 'clsx';
import { SomniaSparkIcon } from './SomniaSparkIcon';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
};

const sizes = {
  sm: { icon: 20, text: 'text-sm' },
  md: { icon: 28, text: 'text-lg' },
  lg: { icon: 36, text: 'text-xl md:text-2xl' },
} as const;

/** Somnia wordmark lockup — sparkle + SOMNIA (ecosystem attribution) */
export function SomniaPartnerLockup({ size = 'md', showLabel = true, className }: Props) {
  const s = sizes[size];

  return (
    <div className={clsx('inline-flex items-center gap-2.5', className)} aria-label="Built on Somnia">
      <SomniaSparkIcon size={s.icon} />
      {showLabel ? (
        <span
          className={clsx(
            'font-sans font-extrabold uppercase tracking-[-0.06em] text-[#F2F2F2]',
            s.text,
          )}
        >
          Somnia
        </span>
      ) : null}
    </div>
  );
}
