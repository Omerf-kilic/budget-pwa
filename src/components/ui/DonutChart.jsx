/**
 * DonutChart — A pure SVG doughnut chart with no external dependencies.
 *
 * Technique:
 *   - Circle radius r ≈ 15.9155, so circumference ≈ 100 (2π × 15.9155 = 100).
 *   - Each arc uses stroke-dasharray="{pct} {100-pct}" and
 *     stroke-dashoffset="-{cumulative}" to position it correctly.
 *   - The SVG group is rotated −90° so segments start at the top (12 o'clock).
 *   - Percentages MUST be amount-based (monetary share), not count-based.
 *
 * @param {Array}  props.segments      - [{ key, label, emoji, color, amountTotal, percentage }]
 * @param {string} [props.centerLine1] - Main text in center (e.g. "€380")
 * @param {string} [props.centerLine2] - Secondary label (e.g. "Total" / "Toplam")
 */
export default function DonutChart({ segments, centerLine1 = '', centerLine2 = '' }) {
  const R  = 15.9155; // radius giving circumference ≈ 100
  const CX = 18;
  const CY = 18;
  const STROKE_WIDTH = 3.8;

  // Only draw segments with a non-zero amount
  const active = segments.filter((s) => (s.amountTotal ?? 0) > 0);
  if (active.length === 0) return null;

  // Build arc descriptors, accumulating the dashoffset per segment
  let cumulative = 0;
  const arcs = active.map((seg) => {
    const pct    = seg.percentage; // amount-based 0–100
    const offset = cumulative;
    cumulative  += pct;
    return { ...seg, pct, offset };
  });

  // Dynamic font size for centerLine1 so it always fits the hole
  const len1 = centerLine1.length;
  const fs1  = len1 > 8 ? 2.8 : len1 > 6 ? 3.2 : len1 > 4 ? 3.8 : 4.6;

  return (
    <svg
      viewBox="0 0 36 36"
      className="w-full"
      role="img"
      aria-label="Expense category donut chart"
    >
      {/* Background track */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={STROKE_WIDTH}
      />

      {/* Colored arc segments — rotated so first segment starts at 12 o'clock */}
      <g transform={`rotate(-90 ${CX} ${CY})`}>
        {arcs.map((arc) => (
          <circle
            key={arc.key}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={arc.color}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${arc.pct} ${100 - arc.pct}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="butt"
            style={{ transition: 'stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease' }}
          />
        ))}
      </g>

      {/* Center: amount (line 1) + label (line 2) */}
      <text
        x={CX} y={CY - 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fs1}
        fontWeight="700"
        fill="white"
      >
        {centerLine1}
      </text>
      <text
        x={CX} y={CY + 4.2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="2.4"
        fill="rgba(148,163,184,0.65)"
      >
        {centerLine2}
      </text>
    </svg>
  );
}
