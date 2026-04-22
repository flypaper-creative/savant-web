import React from 'react';

export default function InterfacePage() {
  return (
    <div className="savant-page-container">
      <section data-snap-section="true" className="min-h-[88svh] flex items-center">
        <div className="max-w-7xl mx-auto w-full savant-grid">
          <div className="md:col-span-6">
            <div className="font-mono text-[10px] tracking-[0.38em] text-gold lowercase mb-6">
              interface chamber
            </div>
            <h1 className="text-[clamp(3rem,8vw,7rem)] font-black tracking-[-0.07em] leading-[0.9] lowercase text-white">
              every surface should feel intentional under the hand
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-[1.75] text-white/55 lowercase max-w-2xl">
              this page is where buttons, cards, motion, type hierarchy,
              spacing behavior, overlays, and display logic can be shown as a
              living doctrine instead of a random pile of components.
            </p>
          </div>

          <div className="md:col-span-6 grid grid-cols-1 gap-5">
            {[
              'motion timing',
              'contrast discipline',
              'cursor language',
              'section choreography',
            ].map((item) => (
              <div key={item} className="glass-panel rounded-[2rem] p-6">
                <div className="text-xl font-black tracking-[-0.04em] text-white lowercase mb-2">
                  {item}
                </div>
                <p className="text-white/50 leading-[1.7] lowercase">
                  this should eventually include live examples, toggles, and
                  side-by-side demonstrations of what savant considers
                  acceptable versus weak.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}