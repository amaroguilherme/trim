'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

// Dynamic import to avoid SSR errors
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="text-zinc-500 text-sm">Carregando Neural Network...</div>
});

interface GraphProps {
  assets: string[];
  selected: string[];
  cut: string[];
}

export default function ForceGraph({ assets, selected, cut }: GraphProps) {
  // Generates simulated graph data based on the input assets
  const data = useMemo(() => {
    const nodes = assets.map((id) => ({
      id,
      group: selected.includes(id) ? 'selected' : 'discarded',
      val: selected.includes(id) ? 20 : 5
    }));

    // Creates random connections to simulate the topology (visual only)
    const links = [];
    for (let i = 0; i < assets.length; i++) {
        const target = assets[Math.floor(Math.random() * assets.length)];
        if (target !== assets[i]) {
            links.push({ source: assets[i], target: target });
        }
    }

    return { nodes, links };
  }, [assets, selected]);

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-black/50">
      <ForceGraph2D
        graphData={data}
        width={600}
        height={400}
        backgroundColor="#000000"
        nodeLabel="id"
        nodeColor={(node: any) => {
            if (selected.includes(node.id)) return '#10b981';
            if (cut.includes(node.id)) return '#ef4444';
            return '#3f3f46';
        }}
        nodeVal={(node: any) => selected.includes(node.id) ? 3 : 1}
        linkColor={() => '#27272a'}
        nodeRelSize={6}
        linkWidth={1}
        enableNodeDrag={false}
        cooldownTicks={100}
        onEngineStop={() => {}} 
      />
    </div>
  );
}