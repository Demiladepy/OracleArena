/** Top-left pixel grid — Somnia Network hero motif */
export function SomniaPixelGrid() {
  const cells: { x: number; y: number; o: number }[] = [];
  const cols = 14;
  const rows = 10;
  const size = 18;
  const gap = 4;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dist = Math.hypot(col / cols, row / rows);
      if (dist > 1.05) continue;
      const o = Math.max(0.08, 0.85 - dist * 0.9 - (col + row) * 0.015);
      cells.push({ x: col * (size + gap), y: row * (size + gap), o });
    }
  }

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-0 h-[min(52vh,420px)] w-[min(72vw,520px)] overflow-hidden"
      aria-hidden
    >
      <svg viewBox="0 0 280 220" className="h-full w-full" fill="none">
        {cells.map((c, i) => (
          <rect
            key={i}
            x={c.x}
            y={c.y}
            width={size}
            height={size}
            rx={3}
            fill={`rgba(255,255,255,${c.o})`}
          />
        ))}
      </svg>
    </div>
  );
}
