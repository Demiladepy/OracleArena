import clsx from 'clsx';

type Props = {
  size?: number;
  className?: string;
};

/**
 * Somnia sparkle mark — white disc with tilted concave four-point star (brand reference geometry).
 */
export function SomniaSparkIcon({ size = 32, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('shrink-0', className)}
      aria-hidden
    >
      <circle cx="24" cy="24" r="24" fill="#F2F2F2" />
      <path
        fill="#000000"
        d="M24 3.5c1.2 8.8 7.2 15.8 16 17.5-8.8 1.2-15.8 7.2-17.5 16-1.2-8.8-7.2-15.8-16-17.5 8.8-1.2 15.8-7.2 17.5-16z"
        transform="rotate(18 24 24)"
      />
    </svg>
  );
}
