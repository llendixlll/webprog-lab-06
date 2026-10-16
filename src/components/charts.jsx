import { monthLabel } from '../format';

// ── міні-спарклайн у KPI-комірці ──
export function Sparkline({ values, color = 'var(--red)', w = 76, h = 30 }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y];
  });
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const [ex, ey] = pts[pts.length - 1];
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <line x1="0" y1={h - 1} x2={w} y2={h - 1} stroke="var(--hair)" strokeWidth="1" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={ex} cy={ey} r="2.4" fill={color} />
    </svg>
  );
}

// ── накопичувальний графік у стилі Odoo (площа з градієнтом) ──
export function AreaChart({ series, start, end, color = 'var(--red)' }) {
  if (!series || series.length < 2) return <div className="muted small">немає даних</div>;
  const W = 760, H = 210, PL = 48, PR = 16, PT = 14, PB = 28;
  const vmax = Math.max(...series) * 1.08 || 1;
  const x = (i) => PL + (i / (series.length - 1)) * (W - PL - PR);
  const y = (v) => H - PB - (v / vmax) * (H - PT - PB);
  const line = series.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(series.length - 1).toFixed(1)} ${(H - PB).toFixed(1)} L${x(0).toFixed(1)} ${(H - PB).toFixed(1)} Z`;
  const ticks = 4;
  const gid = 'ag-' + color.replace(/[^a-z]/gi, '');
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const v = (vmax / ticks) * i, yy = y(v);
        return (
          <g key={i}>
            <line x1={PL} y1={yy} x2={W - PR} y2={yy} stroke="var(--grid)" strokeWidth="1" />
            <text x={PL - 8} y={yy + 3} textAnchor="end" className="axis">
              {v >= 1000 ? (v / 1000).toFixed(0) + 'k' : Math.round(v)}
            </text>
          </g>
        );
      })}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.2"
        strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(0)} cy={y(series[0])} r="3.5" fill={color} />
      <circle cx={x(series.length - 1)} cy={y(series[series.length - 1])} r="3.5" fill={color} />
      <text x={PL} y={H - 8} className="axis">{monthLabel(start)}</text>
      <text x={W - PR} y={H - 8} textAnchor="end" className="axis">{monthLabel(end)}</text>
    </svg>
  );
}

// ── гістограма розподілу часу очікування ──
export function Histogram({ counts, thresholdBin }) {
  if (!counts || !counts.length) return <div className="muted small">немає даних</div>;
  const W = 420, H = 200, PL = 28, PR = 14, PT = 12, PB = 26;
  const max = Math.max(...counts) || 1;
  const bw = (W - PL - PR) / counts.length;
  const thrX = PL + thresholdBin * bw;
  const n = counts.length;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {counts.map((c, i) => {
        const bh = (c / max) * (H - PT - PB);
        const x = PL + i * bw;
        const frac = i / (n - 1);
        const cls = frac > 0.66 ? 'red' : frac > 0.5 ? 'amber' : 'neu';
        return <rect key={i} className={`hbar ${cls}`} x={x + 2} y={H - PB - bh}
          width={bw - 4} height={bh} rx="2" />;
      })}
      <line x1={thrX} y1={PT} x2={thrX} y2={H - PB} className="thr" />
      <text x={thrX + 5} y={PT + 10} className="axis acc">поріг μ+σ</text>
      <text x={PL} y={H - 8} className="axis">0</text>
      <text x={W - PR} y={H - 8} textAnchor="end" className="axis">макс</text>
    </svg>
  );
}
