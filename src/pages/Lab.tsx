import React from 'react';

export default function Lab() {
  return (
    <div className="savant-page-container">
      <section data-snap-section="true" className="min-h-[88svh] flex items-center">
        <div className="max-w-7xl mx-auto w-full savant-stack">
          <div className="max-w-4xl">
            <div className="font-mono text-[10px] tracking-[0.38em] text-gold lowercase mb-6">
              lab chamber
            </div>
            <h1 className="text-[clamp(3rem,8vw,7rem)] font-black tracking-[-0.07em] leading-[0.9] lowercase text-white">
              unstable prototypes belong somewhere visible
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-[1.75] text-white/55 lowercase max-w-3xl">
              the lab is where experimental loaders, shader tests, logo motion,
              interface physics, and atmospheric interactions can live without
              contaminating the cleaner structural pages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              'loader studies',
              'shader tests',
              'motion experiments',
            ].map((item) => (
              <div key={item} className="glass-panel rounded-[2rem] p-6 md:p-8 min-h-[220px]">
                <div className="font-mono text-[10px] tracking-[0.3em] text-white/25 lowercase mb-4">
                  experiment
                </div>
                <div className="text-2xl font-black tracking-[-0.04em] text-white lowercase">
                  {item}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}