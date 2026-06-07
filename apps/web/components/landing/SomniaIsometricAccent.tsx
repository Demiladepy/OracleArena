/** Isometric wireframe accent — Somnia Network infrastructure motif */
export function SomniaIsometricAccent() {
  return (
    <div
      className="pointer-events-none absolute bottom-0 right-0 top-0 z-0 hidden w-[min(48vw,520px)] opacity-40 md:block lg:opacity-55"
      aria-hidden
    >
      <svg viewBox="0 0 400 600" className="h-full w-full" fill="none">
        <g stroke="rgba(255,255,255,0.35)" strokeWidth="1">
          <path d="M280 120 L320 140 L320 180 L280 200 L240 180 L240 140 Z" fill="rgba(255,255,255,0.06)" />
          <path d="M300 200 L340 220 L340 260 L300 280 L260 260 L260 220 Z" fill="rgba(255,255,255,0.04)" />
          <path d="M240 280 L280 300 L280 340 L240 360 L200 340 L200 300 Z" fill="rgba(124,58,237,0.15)" stroke="rgba(124,58,237,0.5)" />
          <path d="M180 380 L220 400 L220 440 L180 460 L140 440 L140 400 Z" fill="rgba(255,255,255,0.05)" />
          <path d="M300 120 L340 140" />
          <path d="M280 200 L300 210 L300 250 L280 260" />
          <path d="M240 180 L260 190 L260 230 L240 240" />
          <circle cx="300" cy="150" r="2" fill="white" />
          <circle cx="260" cy="230" r="2" fill="white" />
          <circle cx="220" cy="320" r="2" fill="#7c3aed" />
        </g>
        <text x="268" y="158" fill="white" fontSize="14" fontFamily="monospace" opacity="0.9">
          {'{s}'}
        </text>
        <path
          d="M120 480 Q200 420 280 480 T440 480"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
          fill="none"
        />
      </svg>
    </div>
  );
}
