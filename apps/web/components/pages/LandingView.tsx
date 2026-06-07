'use client';

import dynamic from 'next/dynamic';
import { HeroSection } from '../landing/HeroSection';
import { ProblemSection } from '../landing/ProblemSection';
import { PrimitivesSection } from '../landing/PrimitivesSection';
import { LiveDemoSection } from '../landing/LiveDemoSection';
import { SomniaVisualStrip } from '../landing/SomniaVisualStrip';
import { LandingFooter } from '../landing/LandingFooter';
import { Skeleton } from '../ui/Skeleton';

const ArchitectureSection = dynamic(
  () => import('../landing/ArchitectureSection').then((m) => m.ArchitectureSection),
  {
    ssr: false,
    loading: () => (
      <section className="flex min-h-screen items-center justify-center landing-bg">
        <Skeleton className="h-64 w-full max-w-lg" />
      </section>
    ),
  },
);

export function LandingView() {
  return (
    <div className="landing-bg min-h-screen text-[var(--text)]">
      <HeroSection />
      <ProblemSection />
      <SomniaVisualStrip />
      <ArchitectureSection />
      <PrimitivesSection />
      <LiveDemoSection />
      <LandingFooter />
    </div>
  );
}
