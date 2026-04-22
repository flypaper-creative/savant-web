import React from 'react';

export default function Signal() {
  return (
    <div className="savant-page-container">
      <section data-snap-section="true" className="min-h-[88svh] flex items-center">
        <div className="max-w-5xl mx-auto w-full">
          <div className="font-mono text-[10px] tracking-[0.38em] text-gold lowercase mb-6">
            signal chamber
          </div>
          <h1 className="text-[clamp(3rem,8vw,7rem)] font-black tracking-[-0.07em] leading-[0.9] lowercase text-white">
            where savant writes instead of merely presenting
          </h1>
          <p className="mt-8 text-lg md:text-xl leading-[1.85] text-white/58 lowercase max-w-4xl">
            this page is for transmissions, fragments, principles, notes,
            field reports, and any thought too sharp to bury inside promotional
            copy. it should feel more like a controlled channel than a blog.
          </p>

          <div className="mt-14 glass-panel rounded-[2rem] p-8 md:p-10">
            <div className="font-mono text-[10px] tracking-[0.3em] text-white/25 lowercase mb-5">
              transmission 01
            </div>
            <p className="text-xl md:text-2xl leading-[1.75] text-white/68 lowercase">
              most digital surfaces are not weak because they lack technology.
              they are weak because nobody decided what the surface was trying
              to become. savant exists to force that decision.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}