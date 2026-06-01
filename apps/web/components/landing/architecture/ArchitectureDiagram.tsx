'use client';

import type { Ref } from 'react';
import { BountyPod } from './BountyPod';
import { AgentPod } from './AgentPod';
import { EvidenceChip } from './EvidenceChip';
import { VerdictBubble } from './VerdictBubble';
import { ConsensusBadge } from './ConsensusBadge';
import { BaseChainIcon } from './BaseChainIcon';

export type ArchitectureDiagramRefs = {
  bounty: Ref<HTMLDivElement>;
  agentA: Ref<HTMLDivElement>;
  agentB: Ref<HTMLDivElement>;
  evidenceA1: Ref<HTMLDivElement>;
  evidenceA2: Ref<HTMLDivElement>;
  evidenceB1: Ref<HTMLDivElement>;
  evidenceB2: Ref<HTMLDivElement>;
  verdictA: Ref<HTMLDivElement>;
  verdictB: Ref<HTMLDivElement>;
  consensus: Ref<HTMLDivElement>;
  base: Ref<HTMLDivElement>;
  flash: Ref<HTMLDivElement>;
  payoutLabel: Ref<HTMLParagraphElement>;
  pathBountyAgentL: Ref<SVGPathElement>;
  pathBountyAgentR: Ref<SVGPathElement>;
  pathAgentEvidenceAL: Ref<SVGPathElement>;
  pathAgentEvidenceAR: Ref<SVGPathElement>;
  pathAgentEvidenceBL: Ref<SVGPathElement>;
  pathAgentEvidenceBR: Ref<SVGPathElement>;
  pathVerdictMergeL: Ref<SVGPathElement>;
  pathVerdictMergeR: Ref<SVGPathElement>;
  pathBountyBase: Ref<SVGPathElement>;
  pathInvestigateA: Ref<SVGPathElement>;
  pathInvestigateB: Ref<SVGPathElement>;
};

type Props = {
  refs: ArchitectureDiagramRefs;
  bountySuccess?: boolean;
};

export function ArchitectureDiagram({ refs, bountySuccess }: Props) {
  return (
    <div className="relative mx-auto aspect-[16/9] w-full max-w-[720px]">
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 800 450"
        fill="none"
        aria-hidden
      >
        <path
          ref={refs.pathBountyAgentL}
          d="M 400 225 L 220 225"
          stroke="#5EEAD4"
          strokeWidth="2"
          className="neon-glow"
          strokeLinecap="round"
        />
        <path
          ref={refs.pathBountyAgentR}
          d="M 400 225 L 580 225"
          stroke="#5EEAD4"
          strokeWidth="2"
          className="neon-glow"
          strokeLinecap="round"
        />
        <path
          ref={refs.pathAgentEvidenceAL}
          d="M 180 225 L 80 160"
          stroke="#5EEAD4"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
        <path
          ref={refs.pathAgentEvidenceAR}
          d="M 180 225 L 80 290"
          stroke="#5EEAD4"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
        <path
          ref={refs.pathAgentEvidenceBL}
          d="M 620 225 L 720 160"
          stroke="#5EEAD4"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
        <path
          ref={refs.pathAgentEvidenceBR}
          d="M 620 225 L 720 290"
          stroke="#5EEAD4"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
        <path
          ref={refs.pathInvestigateA}
          d="M 80 160 L 180 225"
          stroke="#67FFE8"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          opacity="0"
        />
        <path
          ref={refs.pathInvestigateB}
          d="M 720 160 L 620 225"
          stroke="#67FFE8"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          opacity="0"
        />
        <path
          ref={refs.pathVerdictMergeL}
          d="M 180 225 L 400 225"
          stroke="#5EEAD4"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          ref={refs.pathVerdictMergeR}
          d="M 620 225 L 400 225"
          stroke="#5EEAD4"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          ref={refs.pathBountyBase}
          d="M 400 225 L 720 225"
          stroke="#34D399"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <div
        ref={refs.flash}
        className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0"
        aria-hidden
      />

      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <BountyPod ref={refs.bounty} success={bountySuccess} />
        <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <ConsensusBadge ref={refs.consensus} className="opacity-0 scale-0" />
        </div>
      </div>

      <div className="absolute left-[12%] top-1/2 z-10 -translate-y-1/2 md:left-[18%]">
        <AgentPod ref={refs.agentA} label="Agent A" address="0x490B…e60B" />
        <div className="absolute -left-16 top-[-52px] w-[100px]">
          <EvidenceChip ref={refs.evidenceA1} domain="en.wikipedia.org" />
        </div>
        <div className="absolute -left-16 bottom-[-52px] w-[100px]">
          <EvidenceChip ref={refs.evidenceA2} domain="pubchem.ncbi.nlm.nih.gov" />
        </div>
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full">
          <VerdictBubble ref={refs.verdictA} />
        </div>
      </div>

      <div className="absolute right-[12%] top-1/2 z-10 -translate-y-1/2 md:right-[18%]">
        <AgentPod ref={refs.agentB} label="Agent B" address="0xe4Fa…bFed" />
        <div className="absolute -right-16 top-[-52px] w-[100px]">
          <EvidenceChip ref={refs.evidenceB1} domain="bbc.com" />
        </div>
        <div className="absolute -right-16 bottom-[-52px] w-[100px]">
          <EvidenceChip ref={refs.evidenceB2} domain="britannica.com" />
        </div>
        <div className="absolute -left-2 top-1/2 -translate-x-full -translate-y-1/2">
          <VerdictBubble ref={refs.verdictB} />
        </div>
      </div>

      <div className="absolute right-[2%] top-1/2 z-10 -translate-y-1/2">
        <BaseChainIcon ref={refs.base} />
      </div>

      <p
        ref={refs.payoutLabel}
        className="absolute bottom-[8%] right-[8%] font-mono text-[10px] text-success opacity-0"
      >
        0.12 STT → USDC
      </p>
    </div>
  );
}
