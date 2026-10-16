import { useMemo } from 'react';
import { num, durShort, heat } from '../format';

const SEV_COLOR = { high: 'var(--red)', medium: 'var(--amber)', none: 'var(--green)' };

function wrap(name) {
  if (name.length <= 15) return [name];
  const words = name.split(' ');
  if (words.length < 2) return [name];
  let a = '', b = '', half = name.length / 2, acc = 0;
  for (const w of words) {
    if (acc < half) { a += (a ? ' ' : '') + w; acc += w.length + 1; }
    else b += (b ? ' ' : '') + w;
  }
  return b ? [a, b] : [a];
}

export default function ProcessMap({ nodes, edges }) {
  const layout = useMemo(() => {
    if (!nodes || !nodes.length) return null;
    const H = 300, cy = 150;
    const sorted = [...nodes].sort((a, b) => a.pos - b.pos);
    // колонки за близькістю позицій
    const cols = []; let cur = [], lastPos = -1;
    for (const n of sorted) {
      if (cur.length && n.pos - lastPos > 0.09) { cols.push(cur); cur = []; }
      cur.push(n); lastPos = n.pos;
    }
    if (cur.length) cols.push(cur);

    const maxWait = Math.max(...nodes.map((n) => n.avgWait), 1);
    const maxCount = Math.max(...edges.map((e) => e.count), 1);
    // фіксований крок між колонками — полотно росте з кількістю етапів,
    // тож вузли ніколи не налазять один на одного
    const NW = 130, colStep = 168, first = 118;
    const colX = (c) => first + c * colStep;

    const pos = {};
    cols.forEach((list, c) => {
      list.forEach((n, i) => {
        const big = n.severity === 'high';
        const w = big ? 150 : NW, h = big ? 78 : 58, gap = 18;
        const total = list.length * h + (list.length - 1) * gap;
        const y = cy - total / 2 + h / 2 + i * (h + gap);
        pos[n.activity] = { x: colX(c), y, w, h, col: c, big, ...n };
      });
    });
    const W = colX(cols.length - 1) + 75 + 78;
    return { W, H, cy, pos, maxWait, maxCount, startX: 34, endX: W - 34 };
  }, [nodes, edges]);

  if (!layout) return <div className="muted">Недостатньо даних для побудови графа.</div>;
  const { W, H, cy, pos, maxWait, maxCount, startX, endX } = layout;
  const list = Object.values(pos);
  const firstNodes = list.filter((n) => n.col === 0);
  const lastNodes = list.filter((n) => n.col === Math.max(...list.map((m) => m.col)));

  function fwdPath(a, b) {
    const x0 = a.x + a.w / 2, y0 = a.y, x2 = b.x - b.w / 2, y2 = b.y;
    const mx = (x0 + x2) / 2;
    return `M${x0} ${y0} C${mx} ${y0}, ${mx} ${y2}, ${x2} ${y2}`;
  }
  function reworkPath(a, b) {
    const x0 = a.x, y0 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
    const peak = Math.max(y0, y2) + 56;
    return `M${x0} ${y0} Q${(x0 + x2) / 2} ${peak}, ${x2} ${y2}`;
  }

  return (
    <svg className="procmap" viewBox={`0 0 ${W} ${H}`}>
      <defs>
        {['neu', 'red', 'amber'].map((k) => (
          <marker key={k} id={`ah-${k}`} markerWidth="9" markerHeight="9"
            refX="6" refY="3" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0 0 L6 3 L0 6 Z"
              fill={k === 'red' ? 'var(--red)' : k === 'amber' ? 'var(--amber)' : 'var(--hair-2)'} />
          </marker>
        ))}
        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* старт → перші вузли, останні → кінець */}
      {firstNodes.map((n) => (
        <path key={'s' + n.activity} className="edge"
          d={`M${startX + 13} ${cy} C${(startX + n.x) / 2} ${cy}, ${(startX + n.x) / 2} ${n.y}, ${n.x - n.w / 2} ${n.y}`}
          strokeWidth="2" markerEnd="url(#ah-neu)" />
      ))}
      {lastNodes.map((n) => (
        <path key={'e' + n.activity} className="edge"
          d={`M${n.x + n.w / 2} ${n.y} C${(n.x + endX) / 2} ${n.y}, ${(n.x + endX) / 2} ${cy}, ${endX - 13} ${cy}`}
          strokeWidth="2" markerEnd="url(#ah-neu)" />
      ))}

      {/* ребра потоку */}
      {edges.map((e, i) => {
        const a = pos[e.from], b = pos[e.to];
        if (!a || !b) return null;
        const crit = a.severity === 'high' || b.severity === 'high';
        const sw = 1.5 + (e.count / maxCount) * 7;
        if (e.rework) {
          const d = reworkPath(a, b);
          return (
            <g key={i}>
              <path className="edge rework" d={d} strokeWidth="1.8"
                markerEnd="url(#ah-amber)" />
              <ReworkLabel d={d} text={`↺ ${num(e.count)}`} />
            </g>
          );
        }
        const d = fwdPath(a, b);
        return (
          <g key={i}>
            <path className={`edge${crit ? ' crit' : ''}`} d={d}
              strokeWidth={sw} markerEnd={`url(#ah-${crit ? 'red' : 'neu'})`} />
            <EdgeLabel a={a} b={b} text={num(e.count)} crit={crit} />
          </g>
        );
      })}

      {/* старт / кінець */}
      <g className="marker">
        <circle cx={startX} cy={cy} r="13" className="start-ring" />
        <path d={`M${startX - 4} ${cy - 6} L${startX - 4} ${cy + 6} L${startX + 7} ${cy} Z`} className="start-tri" />
        <text x={startX} y={cy + 28} className="pm-cap">старт</text>
      </g>
      <g className="marker">
        <circle cx={endX} cy={cy} r="13" className="end-ring" />
        <rect x={endX - 5} y={cy - 5} width="10" height="10" rx="2" className="end-stop" />
        <text x={endX} y={cy + 28} className="pm-cap">кінець</text>
      </g>

      {/* вузли */}
      {list.map((n) => {
        const col = SEV_COLOR[n.severity] || 'var(--green)';
        const hc = heat(n.avgWait / maxWait);
        const x = n.x - n.w / 2, y = n.y - n.h / 2;
        const lines = n.big ? ['Очікування', 'підпису'] : wrap(n.activity);
        return (
          <g key={n.activity} className={`node ${n.severity}`}
            filter={n.big ? 'url(#glow)' : undefined}>
            <rect x={x} y={y} width={n.w} height={n.h} rx="11"
              className="node-box" style={{ '--sev': col }} />
            <rect x={x + 7} y={y + 7} width={n.w - 14} height="4" rx="2" fill={hc} />
            {n.big ? (
              <>
                <text x={n.x} y={y + 26} className="pm-name big">{n.activity}</text>
                <text x={n.x} y={y + 50} className="pm-big" fill={col}>
                  {durShort(n.avgWait)}
                </text>
                <text x={n.x} y={y + 68} className="pm-sub">
                  z {n.z_score.toFixed(1)}
                </text>
              </>
            ) : (
              <>
                {lines.map((ln, li) => (
                  <text key={li} x={n.x} y={y + 24 + li * 14} className="pm-name">{ln}</text>
                ))}
                <text x={x + 10} y={y + n.h - 14} className="pm-freq">{num(n.frequency)}</text>
                <text x={x + n.w - 10} y={y + n.h - 14} textAnchor="end"
                  className="pm-wait" fill={col}>{durShort(n.avgWait)}</text>
                <rect x={x + 10} y={y + n.h - 9} width={n.w - 20} height="3" rx="1.5" className="bar-bg" />
                <rect x={x + 10} y={y + n.h - 9} width={(n.w - 20) * Math.min(1, n.avgWait / maxWait)}
                  height="3" rx="1.5" fill={hc} />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function EdgeLabel({ a, b, text, crit }) {
  const x = (a.x + a.w / 2 + b.x - b.w / 2) / 2;
  const y = (a.y + b.y) / 2;
  return (
    <g>
      <rect x={x - text.length * 3.6 - 3} y={y - 8} width={text.length * 7.2 + 6}
        height="15" rx="3" className="edge-lbl-bg" />
      <text x={x} y={y + 3} className={`edge-lbl${crit ? ' crit' : ''}`}>{text}</text>
    </g>
  );
}

function ReworkLabel({ d, text }) {
  // приблизна середина квадратичної кривої — нижня точка
  const m = d.match(/M(\S+) (\S+) Q(\S+) (\S+), (\S+) (\S+)/).slice(1).map(Number);
  const [x0, y0, cx, cyy, x2, y2] = m;
  const x = (x0 + 2 * cx + x2) / 4, y = (y0 + 2 * cyy + y2) / 4;
  return (
    <g>
      <rect x={x - text.length * 3.6 - 4} y={y - 8} width={text.length * 7.2 + 8}
        height="15" rx="3" className="edge-lbl-bg" />
      <text x={x} y={y + 3} className="edge-lbl amber">{text}</text>
    </g>
  );
}
