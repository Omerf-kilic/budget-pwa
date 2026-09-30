/**
 * DonutChart — A pure SVG doughnut chart with no external dependencies.
 *
 * Technique:
 *   - Circle radius r ≈ 15.9155, so circumference ≈ 100 (2π × 15.9155 = 100).
 *   - Each arc uses stroke-dasharray="{pct} {100-pct}" and
 *     stroke-dashoffset="{cumulative}" to position it correctly.
 *   - The SVG group is rotated −90° so segments start at the top (12 o'clock).
 *
 * @param {Array}  props.segments   - [{ key, label, emoji, color, count, percentage }]
 * @param {number} [props.total]    - Total transaction count (shown in center)
 * @param {string} [props.label]    - Label shown below the total count in center
 */
export default function DonutChart({ segments, total = 0, label = '' }) {
  const R  = 15.9155; // radius giving circumference ≈ 100
  const CX = 18;
  const CY = 18;
  const STROKE_WIDTH = 4;

  // Only draw segments that have a non-zero count
  const active = segments.filter((s) => s.count > 0);

  if (active.length === 0) return null;

  // Build arc descriptors accumulating the dashoffset
  let cumulative = 0;
  const arcs = active.map((seg) => {
    const pct    = seg.percentage; // already 0-100
    const offset = cumulative;
    cumulative  += pct;
    return { ...seg, pct, offset };
  });

  return (
    <svg
      viewBox="0 0 36 36"
      className="w-full max-w-[220px] mx-auto"
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

      {/* Colored arc segments — rotated so first segment starts at top */}
      <g transform={`rotate(-90 ${CX} ${CY})`}>
        {arcs.map((arc) => (
          <circle
            key={arc.key}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={arc.color}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${arc.pct} ${100 - arc.pct}`}
            strokeDashoffset={-arc.offset}   /* negative = shift forward on path */
            strokeLinecap="butt"
            style={{ transition: 'stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease' }}
          />
        ))}
      </g>

      {/* Center text: total count + label */}
      <text
        x={CX} y={CY - 1.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="5"
        fontWeight="700"
        fill="white"
      >
        {total}
      </text>
      <text
        x={CX} y={CY + 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="2.8"
        fill="rgba(148,163,184,0.8)"
      >
        {label}
      </text>
    </svg>
  );
}
