import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { OracleArenaWordmark } from './OracleArenaWordmark';

type LogoMarkProps = {
  showWordmark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'app' | 'landing';
  className?: string;
  href?: string;
};

const sizeClasses = {
  sm: { image: 'h-8 w-8 md:h-9 md:w-9', wordmark: 'sm' as const, sub: 'text-xs' },
  md: { image: 'h-9 w-9', wordmark: 'md' as const, sub: 'text-xs' },
  lg: { image: 'h-11 w-11', wordmark: 'lg' as const, sub: 'text-sm' },
} as const;

/** Icon-only or icon + wordmark for app chrome */
export function LogoMark({
  showWordmark = true,
  size = 'sm',
  variant = 'app',
  className,
  href = '/',
}: LogoMarkProps) {
  const s = sizeClasses[size];
  const subClass = variant === 'landing' ? 'text-[var(--text-muted)]' : 'text-surface-muted';

  const content = (
    <>
      <div className={clsx('relative shrink-0 overflow-hidden rounded-lg bg-black', s.image)}>
        <Image
          src="/logo.png"
          alt="Oracle Arena"
          fill
          className="object-contain p-0.5"
          sizes="44px"
          priority={size === 'lg'}
        />
      </div>
      {showWordmark ? (
        <div className="min-w-0">
          <OracleArenaWordmark size={s.wordmark} />
          {size === 'sm' && variant === 'app' ? (
            <span className={clsx('hidden sm:block', subClass, s.sub)}>Somnia testnet</span>
          ) : null}
        </div>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={clsx('group flex min-w-0 items-center gap-2 md:gap-3', className)}>
        {content}
      </Link>
    );
  }

  return <div className={clsx('flex min-w-0 items-center gap-2 md:gap-3', className)}>{content}</div>;
}
