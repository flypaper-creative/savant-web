import React from 'react';

export default function ArchivePage() {
  const entries = [
    ['phase 01', 'early structure', 'the point where style began trying to become a system.'],
    ['phase 02', 'motion discipline', 'timing, easing, and atmospheric pressure started becoming intentional.'],
    ['phase 03', 'page divergence', 'the structure opened into separate chambers instead of one repeated template.'],
    ['phase 04', 'signal refinement', 'copy became sharper, denser, cooler, and less apologetic.'],
  ];

  return (
    <div className="savant-page-container">
      <section data-snap-section="true" className="min-h-[88svh] flex items-center">
        <div className="max-w-7xl mx-auto w-full savant-stack">
          <div className="max-w-4xl">
            <div className="font-mono text-[10px] tracking-[0.38em] text-gold lowercase mb-6">
              archive chamber
            </div>
            <h1 className="text-[clamp(3rem,8vw,7rem)] font-black tracking-[-0.07em] leading-[0.9] lowercase text-white">
              memory should feel curated, not dumped
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-[1.75] text-white/55 lowercase max-w-3xl">
              this page exists for progression, milestones, old states,
              recovered ideas, and residues that still matter after the main
              surface has moved on.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {entries.map(([phase, title, copy]) => (
              <div key={phase} className="glass-panel rounded-[2rem] p-6 md:p-8 grid grid-cols-1 md:grid-cols-[0.25fr_0.35fr_1fr] gap-6">
                <div className="font-mono text-[10px] tracking-[0.3em] text-gold lowercase">
                  {phase}
                </div>
                <div className="text-xl font-black tracking-[-0.04em] text-white lowercase">
                  {title}
                </div>
                <p className="text-white/50 leading-[1.7] lowercase">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}