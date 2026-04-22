import React from 'react';

export default function Systems() {
  const systems = [
    {
      title: 'perception layer',
      copy: 'collects and stages visual, textual, and structural input so the interface feels responsive to meaning rather than merely to clicks.',
    },
    {
      title: 'recursion layer',
      copy: 'ensures decisions repeat with variation rather than drift into inconsistency, letting identity feel alive without losing itself.',
    },
    {
      title: 'motion layer',
      copy: 'controls timing, glide, pressure, and release so transitions feel authored and expensive instead of default.',
    },
    {
      title: 'memory layer',
      copy: 'holds project residues, archives, references, and internal continuity so the system can grow without becoming incoherent.',
    },
  ];

  return (
    <div className="savant-page-container">
      <section data-snap-section="true" className="min-h-[88svh] flex items-center">
        <div className="max-w-7xl mx-auto w-full savant-stack">
          <div className="max-w-4xl">
            <div className="font-mono text-[10px] tracking-[0.38em] text-gold lowercase mb-6">
              systems chamber
            </div>
            <h1 className="text-[clamp(3rem,8vw,7rem)] font-black tracking-[-0.07em] leading-[0.9] lowercase text-white">
              the architecture should be legible without becoming boring
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-[1.75] text-white/55 lowercase max-w-3xl">
              this page exists so savant can explain itself with more precision.
              not in marketing language. in systems language.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {systems.map((item) => (
              <div key={item.title} className="glass-panel rounded-[2rem] p-7 md:p-8">
                <div className="font-mono text-[10px] tracking-[0.3em] text-white/25 lowercase mb-4">
                  layer
                </div>
                <div className="text-2xl font-black tracking-[-0.04em] text-white lowercase mb-4">
                  {item.title}
                </div>
                <p className="text-white/52 leading-[1.75] lowercase">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}