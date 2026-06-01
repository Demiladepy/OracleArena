'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Link from 'next/link';
import { useReducedMotion, useIsMobile } from '../../lib/hooks/useReducedMotion';
import { ArchitectureDiagram } from './architecture/ArchitectureDiagram';
import type { ArchitectureDiagramRefs } from './architecture/ArchitectureDiagram';

gsap.registerPlugin(ScrollTrigger);

const CONSENSUS_TX =
  'https://shannon-explorer.somnia.network/tx/0xaafb4879d77e3f242364d6f62846ef0063a7d18bc45c7586b7a0249e2e791a66';

function setupPathDraw(
  path: SVGPathElement | null,
  tl: gsap.core.Timeline,
  at: number,
  duration: number,
) {
  if (!path) return;
  const len = path.getTotalLength();
  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
  tl.to(path, { strokeDashoffset: 0, duration, ease: 'power2.inOut' }, at);
}

export function ArchitectureSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const proofRef = useRef<HTMLParagraphElement>(null);

  const bounty = useRef<HTMLDivElement>(null);
  const agentA = useRef<HTMLDivElement>(null);
  const agentB = useRef<HTMLDivElement>(null);
  const evidenceA1 = useRef<HTMLDivElement>(null);
  const evidenceA2 = useRef<HTMLDivElement>(null);
  const evidenceB1 = useRef<HTMLDivElement>(null);
  const evidenceB2 = useRef<HTMLDivElement>(null);
  const verdictA = useRef<HTMLDivElement>(null);
  const verdictB = useRef<HTMLDivElement>(null);
  const consensus = useRef<HTMLDivElement>(null);
  const base = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const payoutLabel = useRef<HTMLParagraphElement>(null);
  const pathBountyAgentL = useRef<SVGPathElement>(null);
  const pathBountyAgentR = useRef<SVGPathElement>(null);
  const pathAgentEvidenceAL = useRef<SVGPathElement>(null);
  const pathAgentEvidenceAR = useRef<SVGPathElement>(null);
  const pathAgentEvidenceBL = useRef<SVGPathElement>(null);
  const pathAgentEvidenceBR = useRef<SVGPathElement>(null);
  const pathVerdictMergeL = useRef<SVGPathElement>(null);
  const pathVerdictMergeR = useRef<SVGPathElement>(null);
  const pathBountyBase = useRef<SVGPathElement>(null);
  const pathInvestigateA = useRef<SVGPathElement>(null);
  const pathInvestigateB = useRef<SVGPathElement>(null);

  const refs: ArchitectureDiagramRefs = {
    bounty,
    agentA,
    agentB,
    evidenceA1,
    evidenceA2,
    evidenceB1,
    evidenceB2,
    verdictA,
    verdictB,
    consensus,
    base,
    flash,
    payoutLabel,
    pathBountyAgentL,
    pathBountyAgentR,
    pathAgentEvidenceAL,
    pathAgentEvidenceAR,
    pathAgentEvidenceBL,
    pathAgentEvidenceBR,
    pathVerdictMergeL,
    pathVerdictMergeR,
    pathBountyBase,
    pathInvestigateA,
    pathInvestigateB,
  };

  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const [bountySuccess, setBountySuccess] = useState(false);

  useGSAP(
    () => {
      if (!sectionRef.current || !pinRef.current) return;

      const paths = [
        pathBountyAgentL.current,
        pathBountyAgentR.current,
        pathAgentEvidenceAL.current,
        pathAgentEvidenceAR.current,
        pathAgentEvidenceBL.current,
        pathAgentEvidenceBR.current,
        pathVerdictMergeL.current,
        pathVerdictMergeR.current,
        pathBountyBase.current,
      ];
      paths.forEach((p) => {
        if (p) {
          const len = p.getTotalLength();
          gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
        }
      });

      const hidden = [
        agentA.current,
        agentB.current,
        evidenceA1.current,
        evidenceA2.current,
        evidenceB1.current,
        evidenceB2.current,
        verdictA.current,
        verdictB.current,
        consensus.current,
        base.current,
        payoutLabel.current,
      ];
      gsap.set(bounty.current, { scale: 0, opacity: 0 });
      gsap.set(hidden, { opacity: 0, scale: 0.85 });
      gsap.set(flash.current, { opacity: 0, scale: 0.5 });
      if (proofRef.current) gsap.set(proofRef.current, { opacity: 0, y: 12 });

      if (reduced) {
        gsap.set(bounty.current, { scale: 1, opacity: 1 });
        gsap.set(hidden, { opacity: 1, scale: 1 });
        paths.forEach((p) => p && gsap.set(p, { strokeDashoffset: 0, opacity: 1 }));
        setBountySuccess(true);
        if (proofRef.current) gsap.set(proofRef.current, { opacity: 1, y: 0 });
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: mobile ? 'bottom center' : '+=600%',
          pin: mobile ? false : pinRef.current,
          pinSpacing: !mobile,
          scrub: mobile ? false : 1,
          anticipatePin: 1,
          ...(mobile ? { toggleActions: 'play none none none', once: true } : {}),
        },
        ...(mobile ? { duration: 3.5 } : {}),
        onUpdate: () => {
          if (!mobile) setBountySuccess(tl.progress() > 0.72);
        },
        onComplete: () => {
          if (mobile) setBountySuccess(true);
        },
      });

      tl.to(bounty.current, { scale: 1, opacity: 1, duration: 0.15, ease: 'back.out(1.4)' }, 0);

      setupPathDraw(pathBountyAgentL.current, tl, 0.15, 0.08);
      setupPathDraw(pathBountyAgentR.current, tl, 0.17, 0.08);
      tl.to(agentA.current, { opacity: 1, scale: 1, duration: 0.1 }, 0.22);
      tl.to(agentB.current, { opacity: 1, scale: 1, duration: 0.1 }, 0.26);

      setupPathDraw(pathAgentEvidenceAL.current, tl, 0.3, 0.06);
      setupPathDraw(pathAgentEvidenceAR.current, tl, 0.32, 0.06);
      setupPathDraw(pathAgentEvidenceBL.current, tl, 0.34, 0.06);
      setupPathDraw(pathAgentEvidenceBR.current, tl, 0.36, 0.06);
      tl.to(
        [evidenceA1.current, evidenceA2.current, evidenceB1.current, evidenceB2.current],
        { opacity: 1, scale: 1, duration: 0.08, stagger: 0.02 },
        0.38,
      );

      tl.to([evidenceA1.current, evidenceA2.current], { scale: 1.1, duration: 0.05, yoyo: true, repeat: 1 }, 0.5);
      tl.to([evidenceB1.current, evidenceB2.current], { scale: 1.1, duration: 0.05, yoyo: true, repeat: 1 }, 0.52);
      tl.to([verdictA.current, verdictB.current], { opacity: 1, scale: 1, duration: 0.1, stagger: 0.04 }, 0.55);

      setupPathDraw(pathVerdictMergeL.current, tl, 0.65, 0.08);
      setupPathDraw(pathVerdictMergeR.current, tl, 0.67, 0.08);
      tl.to([verdictA.current, verdictB.current], { opacity: 0, scale: 0.6, duration: 0.1 }, 0.72);
      tl.to(flash.current, { opacity: 0.85, scale: 1.3, duration: 0.04 }, 0.76);
      tl.to(flash.current, { opacity: 0, duration: 0.06 }, 0.8);
      tl.to(consensus.current, { opacity: 1, scale: 1, duration: 0.12, ease: 'back.out(2)' }, 0.78);

      setupPathDraw(pathBountyBase.current, tl, 0.85, 0.1);
      tl.to(base.current, { opacity: 1, scale: 1, duration: 0.1 }, 0.9);
      tl.to(payoutLabel.current, { opacity: 1, duration: 0.08 }, 0.92);
      if (proofRef.current) {
        tl.to(proofRef.current, { opacity: 1, y: 0, duration: 0.1 }, 0.95);
      }

      if (headingRef.current) {
        gsap.fromTo(
          headingRef.current,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
          },
        );
      }

      return () => {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.vars.trigger === sectionRef.current) st.kill();
        });
      };
    },
    { scope: sectionRef, dependencies: [reduced, mobile] },
  );

  return (
    <section ref={sectionRef} className="relative landing-bg">
      <div
        ref={pinRef}
        className="flex min-h-screen flex-col items-center justify-center px-4 py-16 md:px-8"
      >
        <h2
          ref={headingRef}
          className="mb-8 text-center font-display text-3xl font-bold text-[var(--text)] md:text-4xl"
        >
          Here&apos;s how Oracle Arena works
        </h2>

        <ArchitectureDiagram refs={refs} bountySuccess={bountySuccess} />

        <p
          ref={proofRef}
          className="mt-8 max-w-lg text-center text-sm text-[var(--text-dim)]"
        >
          This actually happened on Somnia testnet.{' '}
          <Link
            href={CONSENSUS_TX}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring rounded font-mono text-cyan hover:underline"
          >
            Tx 0xaafb4879…
          </Link>
        </p>
      </div>
    </section>
  );
}
