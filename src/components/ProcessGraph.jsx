import { useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone';

// колір вузла залежно від рівня вузького місця
const colorBy = (s) =>
  s === 'high' ? '#E74C3C' : s === 'medium' ? '#E67E22' : '#3A6EA5';

export default function ProcessGraph({ nodes, edges }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !nodes) return;
    const data = {
      nodes: nodes.map((n) => ({
        id: n.activity,
        label: `${n.activity}\n${Math.round(n.avgWait)} хв`,
        color: {
          background: colorBy(n.severity),
          border: colorBy(n.severity),
        },
        font: { color: '#fff', multi: false, size: 15 },
        shape: 'box',
        margin: 10,
      })),
      edges: edges.map((e) => ({
        from: e.from,
        to: e.to,
        label: `${Math.round(e.minutes)} хв`,
        arrows: 'to',
        color: { color: '#8892a0' },
        font: { color: '#aab2bd', size: 12, strokeWidth: 0 },
      })),
    };
    const network = new Network(ref.current, data, {
      layout: { hierarchical: { direction: 'LR', sortMethod: 'directed',
        levelSeparation: 190, nodeSpacing: 120 } },
      physics: false,
      interaction: { dragNodes: true, zoomView: true },
    });
    network.once('afterDrawing', () => network.fit({ animation: false }));
    return () => network.destroy();
  }, [nodes, edges]);

  return <div ref={ref} className="graph" />;
}
