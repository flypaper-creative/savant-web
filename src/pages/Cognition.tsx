import React from 'react';
import { motion } from 'motion/react';

export default function Cognition() {
  return (
    <div className="savant-page-container">
      <section data-snap-section="true" className="min-h-[88svh] flex items-center">
        <div className="max-w-7xl mx-auto w-full savant-grid items-start">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-7"
          >
            <div className="font-mono text-[10px] tracking-[0.38em] text-gold lowercase mb-6">
              cognition chamber
            </div>
            <h1 className="text-[clamp(3rem,8vw,7rem)] font-black tracking-[-0.07em] leading-[0.9] lowercase text-white">
              the page where the system appears to think out loud
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-[1.75] text-white/55 lowercase max-w-3xl">
              this chamber should eventually house live node behavior, recursive
              diagrams, equation-field overlays, and any interface element that
              feels closer to inference than presentation.
            </p>
          </motion.div>

          <div className="md:col-span-5 grid grid-cols-1 gap-5">
            {[
              'node interaction',
              'perception overlays',
              'signal clustering',
              'memory traces',
            ].map((item) => (
              <div key={item} className="glass-panel rounded-[2rem] p-6">
                <div className="font-mono text-[10px] tracking-[0.3em] text-white/25 lowercase mb-3">
                  module
                </div>
                <div className="text-xl font-black tracking-[-0.03em] text-white lowercase">
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