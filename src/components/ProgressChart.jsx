// Pure-SVG "heaviest set over time" chart. No chart library.
// Geometry & rules come from the dashboard frontend handoff (§3 "Chart component").

const W = 340;
const H = 188;
const PAD_L = 12;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 30;

const PLOT_L = PAD_L;
const PLOT_R = W - PAD_R;
const PLOT_T = PAD_T;
const PLOT_B = H - PAD_B;
const PLOT_W = PLOT_R - PLOT_L;
const PLOT_H = PLOT_B - PLOT_T;

const fmtVal = (v) => v.toLocaleString(undefined, { maximumFractionDigits: 0 });
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

function ProgressChart({ series, pr }) {
  const n = series.length;
  if (n === 0) return null;

  const values = series.map((s) => s.value);

  // Y domain: padded 22% below / 16% above; if all equal, expand ±5 first.
  let vmin = Math.min(...values);
  let vmax = Math.max(...values);
  if (vmin === vmax) {
    vmin -= 5;
    vmax += 5;
  }
  const span = vmax - vmin;
  const domainMin = vmin - span * 0.22;
  const domainMax = vmax + span * 0.16;

  const xFor = (i) => (n === 1 ? (PLOT_L + PLOT_R) / 2 : PLOT_L + (i / (n - 1)) * PLOT_W);
  const yFor = (v) => PLOT_T + (1 - (v - domainMin) / (domainMax - domainMin)) * PLOT_H;

  const pts = series.map((s, i) => ({ x: xFor(i), y: yFor(s.value) }));

  // PR point index (first match by value + date), if any.
  const prIndex = pr
    ? series.findIndex((s) => s.value === pr.value && s.date === pr.date)
    : -1;

  const gridId = 'chart-grad';
  const gridlines = [0, 0.5, 1].map((f) => {
    const value = domainMin + f * (domainMax - domainMin);
    return { y: yFor(value), label: fmtVal(value) };
  });

  const linePoints = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const areaD =
    n >= 2
      ? `M ${pts[0].x},${PLOT_B} L ${pts.map((p) => `${p.x},${p.y}`).join(' L ')} L ${
          pts[n - 1].x
        },${PLOT_B} Z`
      : null;

  // X labels: first & last always; the PR date too if it's >1 away from both ends.
  const showPrLabel = prIndex > 1 && prIndex < n - 2;
  const xLabels = [];
  if (n === 1) {
    xLabels.push({ x: xFor(0), text: fmtDate(series[0].date), anchor: 'middle' });
  } else {
    xLabels.push({ x: xFor(0), text: fmtDate(series[0].date), anchor: 'start' });
    xLabels.push({ x: xFor(n - 1), text: fmtDate(series[n - 1].date), anchor: 'end' });
    if (showPrLabel) {
      xLabels.push({ x: xFor(prIndex), text: fmtDate(series[prIndex].date), anchor: 'middle' });
    }
  }

  return (
    <svg
      className="chart-svg"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Heaviest set over time"
    >
      <defs>
        <linearGradient id={gridId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {gridlines.map((g, i) => (
        <g key={i}>
          <line className="chart-grid" x1={PLOT_L} y1={g.y} x2={PLOT_R} y2={g.y} />
          <text className="chart-grid-label" x={PLOT_R} y={g.y - 4} textAnchor="end">
            {g.label}
          </text>
        </g>
      ))}

      {areaD && <path d={areaD} fill={`url(#${gridId})`} stroke="none" />}
      {n >= 2 && <polyline className="chart-line" fill="none" points={linePoints} />}

      {pts.map((p, i) => {
        const isPr = i === prIndex;
        const isLast = i === n - 1;
        if (isPr) {
          return (
            <g key={i}>
              <circle className="chart-dot-ring" cx={p.x} cy={p.y} r={7.5} />
              <circle className="chart-dot-pr" cx={p.x} cy={p.y} r={4.5} />
            </g>
          );
        }
        return (
          <circle key={i} className="chart-dot" cx={p.x} cy={p.y} r={isLast ? 4.5 : 2.8} />
        );
      })}

      {xLabels.map((l, i) => (
        <text key={i} className="chart-x-label" x={l.x} y={H - 8} textAnchor={l.anchor}>
          {l.text}
        </text>
      ))}
    </svg>
  );
}

export default ProgressChart;
