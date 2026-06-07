import { cn } from '../../lib/utils/format';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

const variants = {
  primary: 'bg-white text-black hover:bg-white/90 font-medium border border-white',
  secondary:
    'bg-transparent text-white border border-white/25 hover:border-white/50 hover:bg-white/5',
  ghost: 'text-surface-muted hover:text-white hover:bg-white/5',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-none',
  md: 'px-5 py-2.5 text-sm rounded-none',
  lg: 'px-7 py-3.5 text-base rounded-none',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
