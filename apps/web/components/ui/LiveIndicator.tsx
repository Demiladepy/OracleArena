import { SomniaPill } from '../shared/SomniaPill';

export function LiveIndicator({ active = true, className }: { active?: boolean; className?: string }) {
  if (!active) return null;
  return <SomniaPill label="Live" dot="green" className={className} />;
}
