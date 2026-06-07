import Image from 'next/image';
import { SomniaPartnerLockup } from '../shared/SomniaPartnerLockup';
import { SomniaPill } from '../shared/SomniaPill';

const panels = [
  {
    src: '/somnia/isometric-blocks.png',
    alt: 'Isometric data blocks on Somnia',
  },
  {
    src: '/somnia/isometric-network.png',
    alt: 'Isometric network topology on Somnia',
  },
  {
    src: '/somnia/pixel-grid.png',
    alt: 'Somnia pixel grid motif',
  },
] as const;

/** Three-panel Somnia Network visual strip */
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
          {panels.map((panel) => (
            <div
              key={panel.src}
              className="relative aspect-[4/3] overflow-hidden border border-white/10 bg-black"
            >
              <Image
                src={panel.src}
                alt={panel.alt}
                fill
                className="object-cover object-center opacity-90"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
