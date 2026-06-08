import type { ReactNode } from 'react';

type PanelProps = {
  className?: string;
};

const stroke = 'rgba(255,255,255,0.38)';
const strokeStrong = 'rgba(255,255,255,0.55)';
const face = 'rgba(255,255,255,0.06)';
const faceDim = 'rgba(255,255,255,0.03)';
const purple = '#7c3aed';
const purpleFill = 'rgba(124,58,237,0.22)';
const green = '#22c55e';
const cyan = '#22d3ee';

function PanelFrame({ children, label, sublabel }: { children: ReactNode; label: string; sublabel: string }) {
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 400 300" className="h-full w-full" fill="none" aria-hidden>
        <defs>
          <linearGradient id="infra-grid" x1="0" y1="0" x2="400" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity="0.04" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#infra-grid)" />
        <g stroke={stroke} strokeWidth="0.75" opacity="0.35">
          {[...Array(9)].map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 37.5} x2="400" y2={i * 37.5} />
          ))}
          {[...Array(11)].map((_, i) => (
            <line key={`v-${i}`} x1={i * 40} y1="0" x2={i * 40} y2="300" />
          ))}
        </g>
        {children}
        <text
          x="20"
          y="278"
          fill="rgba(255,255,255,0.85)"
          fontSize="11"
          fontFamily="var(--font-mono, ui-monospace, monospace)"
          letterSpacing="0.12em"
        >
          {label}
        </text>
        <text x="20" y="292" fill="rgba(163,163,163,0.9)" fontSize="9" fontFamily="var(--font-sans, sans-serif)">
          {sublabel}
        </text>
      </svg>
    </div>
  );
}

/** Isometric validator stack — Somnia L1 sub-second finality */
function isoStack(cx: number, cy: number, layers: number, accent = false) {
  const items = [];
  for (let i = 0; i < layers; i++) {
    const y = cy - i * 18;
    const fill = i === layers - 1 && accent ? purpleFill : i === 0 ? faceDim : face;
    const s = i === layers - 1 && accent ? purple : stroke;
    items.push(
      <g key={i}>
        <path
          d={`M${cx} ${y} L${cx + 28} ${y + 16} L${cx} ${y + 32} L${cx - 28} ${y + 16} Z`}
          fill={fill}
          stroke={s}
          strokeWidth="1"
        />
        <path
          d={`M${cx} ${y + 32} L${cx + 28} ${y + 16} L${cx + 28} ${y + 32} L${cx} ${y + 48} Z`}
          fill={faceDim}
          stroke={stroke}
          strokeWidth="0.75"
        />
        <path
          d={`M${cx} ${y + 32} L${cx - 28} ${y + 16} L${cx - 28} ${y + 32} L${cx} ${y + 48} Z`}
          fill={face}
          stroke={stroke}
          strokeWidth="0.75"
        />
        {i === layers - 1 && accent ? (
          <rect x={cx - 10} y={y + 10} width="20" height="12" rx="1" fill={purple} opacity="0.85" />
        ) : null}
      </g>,
    );
  }
  return items;
}

export function FinalityDiagram({ className }: PanelProps) {
  return (
    <div className={className}>
      <PanelFrame label="SOMNIA L1" sublabel="Sub-second block finality">
        <g>{isoStack(200, 118, 4, true)}</g>
        <g>{isoStack(118, 168, 3, false)}</g>
        <g>{isoStack(282, 168, 3, false)}</g>
        <g>{isoStack(200, 218, 3, false)}</g>
        <path
          d="M200 86 L200 62"
          stroke={green}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.9"
        />
        <circle cx="200" cy="58" r="4" fill={green} opacity="0.9" />
        <circle cx="200" cy="58" r="8" stroke={green} strokeWidth="1" opacity="0.35" />
        <text
          x="200"
          y="48"
          textAnchor="middle"
          fill={green}
          fontSize="9"
          fontFamily="var(--font-mono, ui-monospace, monospace)"
        >
          &lt;1s
        </text>
        <path
          d="M118 168 L200 118 M282 168 L200 118 M200 218 L200 166"
          stroke={strokeStrong}
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.45"
        />
      </PanelFrame>
    </div>
  );
}

function agentNode(cx: number, cy: number) {
  return (
    <g>
      <path
        d={`M${cx} ${cy} L${cx + 22} ${cy + 13} L${cx} ${cy + 26} L${cx - 22} ${cy + 13} Z`}
        fill={face}
        stroke={stroke}
        strokeWidth="1"
      />
      <path
        d={`M${cx} ${cy + 26} L${cx + 22} ${cy + 13} L${cx + 22} ${cy + 26} L${cx} ${cy + 39} Z`}
        fill={faceDim}
        stroke={stroke}
        strokeWidth="0.75"
      />
      <path
        d={`M${cx} ${cy + 26} L${cx - 22} ${cy + 13} L${cx - 22} ${cy + 26} L${cx} ${cy + 39} Z`}
        fill={face}
        stroke={stroke}
        strokeWidth="0.75"
      />
      <circle cx={cx} cy={cy + 10} r="4" fill="rgba(255,255,255,0.7)" />
      <path
        d={`M${cx - 6} ${cy + 18} Q${cx} ${cy + 14} ${cx + 6} ${cy + 18}`}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1"
        fill="none"
      />
    </g>
  );
}

/** Resolver mesh — native agents wake on bounty events */
export function AgentsDiagram({ className }: PanelProps) {
  return (
    <div className={className}>
      <PanelFrame label="RESOLVER MESH" sublabel="Native agents · inferToolsChat">
        <g>
          <path
            d="M200 128 L240 151 L200 174 L160 151 Z"
            fill={purpleFill}
            stroke={purple}
            strokeWidth="1.25"
          />
          <path
            d="M200 174 L240 151 L240 174 L200 197 Z"
            fill="rgba(124,58,237,0.12)"
            stroke={purple}
            strokeWidth="0.75"
            opacity="0.8"
          />
          <path
            d="M200 174 L160 151 L160 174 L200 197 Z"
            fill={purpleFill}
            stroke={purple}
            strokeWidth="0.75"
            opacity="0.8"
          />
          <text
            x="200"
            y="158"
            textAnchor="middle"
            fill="white"
            fontSize="18"
            fontFamily="var(--font-mono, ui-monospace, monospace)"
            opacity="0.95"
          >
            {'{ }'}
          </text>
        </g>
        {agentNode(96, 118)}
        {agentNode(304, 118)}
        {agentNode(200, 228)}
        {agentNode(72, 208)}
        {agentNode(328, 208)}
        <path d="M200 151 L96 131" stroke={cyan} strokeWidth="1.25" opacity="0.7" />
        <path d="M200 151 L304 131" stroke={cyan} strokeWidth="1.25" opacity="0.7" />
        <path d="M200 174 L200 228" stroke={cyan} strokeWidth="1.25" opacity="0.7" />
        <path d="M160 164 L72 218" stroke={strokeStrong} strokeWidth="1" opacity="0.5" />
        <path d="M240 164 L328 218" stroke={strokeStrong} strokeWidth="1" opacity="0.5" />
        <circle cx="200" cy="151" r="3" fill={cyan} />
        <circle cx="96" cy="131" r="2" fill="white" opacity="0.6" />
        <circle cx="304" cy="131" r="2" fill="white" opacity="0.6" />
        <circle cx="200" cy="228" r="2" fill="white" opacity="0.6" />
      </PanelFrame>
    </div>
  );
}

function contractLayer(y: number, label: string, accent = false) {
  const cx = 200;
  const cy = y;
  const fill = accent ? purpleFill : face;
  const s = accent ? purple : stroke;
  return (
    <g key={label}>
      <path
        d={`M${cx} ${cy} L${cx + 52} ${cy + 30} L${cx} ${cy + 60} L${cx - 52} ${cy + 30} Z`}
        fill={fill}
        stroke={s}
        strokeWidth="1"
      />
      <path
        d={`M${cx} ${cy + 60} L${cx + 52} ${cy + 30} L${cx + 52} ${cy + 60} L${cx} ${cy + 90} Z`}
        fill={faceDim}
        stroke={stroke}
        strokeWidth="0.75"
      />
      <path
        d={`M${cx} ${cy + 60} L${cx - 52} ${cy + 30} L${cx - 52} ${cy + 60} L${cx} ${cy + 90} Z`}
        fill={face}
        stroke={stroke}
        strokeWidth="0.75"
      />
      <text
        x={cx}
        y={cy + 38}
        textAnchor="middle"
        fill="rgba(255,255,255,0.88)"
        fontSize="9"
        fontFamily="var(--font-mono, ui-monospace, monospace)"
        letterSpacing="0.06em"
      >
        {label}
      </text>
    </g>
  );
}

/** On-chain stack — bounty → consensus → settlement + appeals */
export function TruthDiagram({ className }: PanelProps) {
  return (
    <div className={className}>
      <PanelFrame label="ON-CHAIN TRUTH" sublabel="Consensus · appeals · settlement">
        {contractLayer(52, 'BountyBoard')}
        {contractLayer(112, 'ConsensusEngine', true)}
        {contractLayer(172, 'AppealLayer')}
        {contractLayer(232, 'Settlement')}
        <path d="M200 112 L200 122" stroke={strokeStrong} strokeWidth="1.5" markerEnd="url(#arrow)" />
        <path d="M200 172 L200 182" stroke={strokeStrong} strokeWidth="1.5" />
        <path d="M200 232 L200 242" stroke={strokeStrong} strokeWidth="1.5" />
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,255,255,0.5)" />
          </marker>
        </defs>
        <g transform="translate(318, 118)">
          <circle cx="0" cy="0" r="18" stroke={green} strokeWidth="1.25" fill="rgba(34,197,94,0.12)" />
          <path
            d="M-6 0 L-1 6 L8 -5"
            stroke={green}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
        <text
          x="318"
          y="152"
          textAnchor="middle"
          fill="rgba(163,163,163,0.95)"
          fontSize="8"
          fontFamily="var(--font-mono, ui-monospace, monospace)"
        >
          VERDICT
        </text>
        <path
          d="M252 148 Q285 148 300 118"
          stroke={green}
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.65"
        />
      </PanelFrame>
    </div>
  );
}
