import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  value: number;
}

export const NeuralLatticeViz: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 600;

    const nodes: Node[] = Array.from({ length: 50 }, (_, i) => ({
      id: `node-${i}`,
      group: Math.floor(Math.random() * 5)
    }));

    const links: any[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const numLinks = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numLinks; j++) {
        const target = Math.floor(Math.random() * nodes.length);
        if (target !== i) {
          links.push({ source: nodes[i].id, target: nodes[target].id, value: Math.random() });
        }
      }
    }

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height] as any)
      .attr('style', 'max-width: 100%; height: auto;');

    svg.selectAll('*').remove();

    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, any>(links).id((d: any) => d.id).distance(50))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1));

    const link = svg.append('g')
      .attr('stroke', '#FF4068')
      .attr('stroke-opacity', 0.3)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.value) * 2);

    const node = svg.append('g')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 5)
      .attr('fill', d => {
        const colors = ['#FF4068', '#E6C03B', 'currentColor', '#444444', '#222222'];
        return colors[d.group];
      });

    node.append('title').text(d => d.id);

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x!)
        .attr('y1', d => (d.source as any).y!)
        .attr('x2', d => (d.target as any).x!)
        .attr('y2', d => (d.target as any).y!);

      node
        .attr('cx', d => (d as any).x!)
        .attr('cy', d => (d as any).y!);
    });

    // Add some "glitch" movement
    const glitchInt = setInterval(() => {
      nodes.forEach(n => {
        if (Math.random() > 0.9) {
          (n as any).x! += (Math.random() - 0.5) * 10;
          (n as any).y! += (Math.random() - 0.5) * 10;
        }
      });
      simulation.alpha(0.1).restart();
    }, 2000);

    return () => {
      simulation.stop();
      clearInterval(glitchInt);
    };
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center bg-obsidian/20 overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
