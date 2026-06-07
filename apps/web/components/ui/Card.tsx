import { cn } from '../../lib/utils/format';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  hover?: boolean;
};

export function Card({ children, className, accent, hover }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-none border border-white/10 bg-[var(--bg-card)] p-6 shadow-card',
        accent && 'border-l-2 border-l-white border-y-white/10 border-r-white/10',
        hover && 'transition-all duration-200 hover:border-white/25',
        className,
      )}
    >
      {children}
    </div>
  );
}
