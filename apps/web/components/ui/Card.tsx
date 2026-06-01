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
        'rounded-2xl border border-white/8 bg-navy-elevated/80 p-6 shadow-card backdrop-blur-sm',
        accent && 'border-l-2 border-l-cyan border-y-white/8 border-r-white/8',
        hover && 'transition-all duration-200 hover:border-cyan/25 hover:shadow-glow',
        className,
      )}
    >
      {children}
    </div>
  );
}
