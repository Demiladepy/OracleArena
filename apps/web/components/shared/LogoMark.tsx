import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';

type LogoMarkProps = {
  showWordmark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'app' | 'landing';
  className?: string;
  href?: string;
};

const sizeClasses = {
  sm: { image: 'h-8 w-8 md:h-9 md:w-9', text: 'text-base md:text-lg', sub: 'text-xs' },
  md: { image: 'h-9 w-9', text: 'text-lg', sub: 'text-xs' },
  lg: { image: 'h-11 w-11', text: 'text-xl', sub: 'text-sm' },
} as const;

export function LogoMark({
  showWordmark = true,
  size = 'sm',
  variant = 'app',
  className,
  href = '/',
}: LogoMarkProps) {
  const s = sizeClasses[size];
  const titleClass =
    variant === 'landing'
      ? 'text-[var(--text)] group-hover:text-white'
      : 'text-surface-text group-hover:text-white';
  const subClass = variant === 'landing' ? 'text-[var(--text-muted)]' : 'text-surface-muted';

  const content = (
    <>
      <div
        className={clsx(
          'relative shrink-0 overflow-hidden rounded-full ring-1 ring-amber-900/50 ring-offset-1 ring-offset-transparent shadow-glow',
          s.image,
        )}
      >
        <Image
          src="/logo.png"
          alt="Oracle Arena — Opon Ifa mark"
          fill
          className="object-cover"
          sizes="44px"
          priority={size === 'lg'}
        />
      </div>
      {showWordmark ? (
        <div className="min-w-0">
          <span className={clsx('block truncate font-display font-semibold transition-colors', titleClass, s.text)}>
            Oracle Arena
          </span>
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
