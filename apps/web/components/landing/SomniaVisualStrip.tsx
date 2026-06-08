import { SomniaPartnerLockup } from '../shared/SomniaPartnerLockup';
import { SomniaPill } from '../shared/SomniaPill';
import {
  AgentsDiagram,
  FinalityDiagram,
  TruthDiagram,
} from './infrastructure/InfrastructureDiagrams';

const panels = [
  {
    id: 'finality',
    title: 'Sub-second finality',
    Diagram: FinalityDiagram,
  },
  {
    id: 'agents',
    title: 'Native agents',
    Diagram: AgentsDiagram,
  },
  {
    id: 'truth',
    title: 'On-chain truth',
    Diagram: TruthDiagram,
  },
] as const;

/** Three-panel infrastructure architecture strip */
export function SomniaVisualStrip() {
  return (
    <section className="border-t border-white/10 bg-black px-4 py-16 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="somnia-partner-strip mb-12">
          <SomniaPartnerLockup size="md" />
          <div className="flex flex-wrap gap-2">
            <SomniaPill label="Sub-second finality" dot="green" />
            <SomniaPill label="Native agents" dot="purple" />
            <SomniaPill label="Data streams" dot="cyan" />
          </div>
        </div>
        <p className="somnia-label text-center">Infrastructure</p>
        <h2 className="somnia-headline mt-4 text-center text-2xl md:text-3xl">
          Sub-second finality. Native agents. On-chain truth.
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {panels.map(({ id, title, Diagram }) => (
            <figure
              key={id}
              className="relative aspect-[4/3] overflow-hidden border border-white/10 bg-[#050505]"
            >
              <Diagram className="absolute inset-0" />
              <figcaption className="sr-only">{title}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
