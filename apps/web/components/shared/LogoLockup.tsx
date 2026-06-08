import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { OracleArenaWordmark } from './OracleArenaWordmark';

type LogoLockupProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  href?: string;
  showWordmark?: boolean;
};

const sizes = {
  sm: { icon: 32, box: 'h-8 w-8 md:h-9 md:w-9' },
  md: { icon: 36, box: 'h-9 w-9' },
  lg: { icon: 48, box: 'h-12 w-12 md:h-14 md:w-14' },
} as const;

/** Icon + wordmark horizontal lockup (brand sheet) */
export function LogoLockup({
  size = 'md',
  className,
  href = '/',
  showWordmark = true,
}: LogoLockupProps) {
  const s = sizes[size];

  const content = (
    <>
      <div className={clsx('relative shrink-0 overflow-hidden rounded-lg bg-black', s.box)}>
        <Image
          src="/logo.png"
          alt="Oracle Arena"
          fill
          className="object-contain p-0.5"
          sizes={`${s.icon}px`}
          priority={size === 'lg'}
        />
      </div>
      {showWordmark ? <OracleArenaWordmark size={size} /> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={clsx('group inline-flex items-center gap-2.5 md:gap-3', className)}>
        {content}
      </Link>
    );
  }

  return <div className={clsx('inline-flex items-center gap-2.5 md:gap-3', className)}>{content}</div>;
}
