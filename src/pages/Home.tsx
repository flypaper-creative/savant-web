import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const sectionTransition = {
  duration: 0.9,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

function SectionHeader({
  label,
  title,
  copy,
}: {
  label: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="max-w-4xl">
      <div className="font-mono text-[10px] tracking-[0.38em] text-gold lowercase mb-6">
        {label}
      </div>
      <h2 className="text-[clamp(2.4rem,6vw,6rem)] font-black tracking-[-0.06em] leading-[0.92] lowercase text-white">
        {title}
      </h2>
      <p className="mt-6 text-lg md:text-xl leading-[1.7] text-white/55 lowercase max-w-3xl">
        {copy}
      </p>
    </div>
  );
}

function MetricCard({
  title,
  copy,
  value,
}: {
  title: string;
  copy: string;
  value: string;
}) {
  return (
    <div className="glass-panel rounded-[2rem] p-6 md:p-8 h-full">
      <div className="font-mono text-[10px] tracking-[0.34em] text-white/25 lowercase mb-4">
        {title}
      </div>
      <div className="text-3xl md:text-4xl font-black tracking-[-0.04em] text-white lowercase mb-4">
        {value}
      </div>
      <p className="text-sm md:text-base leading-[1.7] text-white/50 lowercase">
        {copy}
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative">
      <section
        data-snap-section="true"
        className="min-h-[100svh] savant-page-container flex items-center"
      >
        <div className="max-w-7xl mx-auto w-full savant-grid items-end">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={sectionTransition}
            className="md:col-span-8"
          >
            <div className="font-mono text-[10px] tracking-[0.4em] text-gold lowercase mb-6">
              sovereign interface architecture
            </div>

            <h1 className="text-[clamp(3.8rem,11vw,10rem)] font-black tracking-[-0.08em] leading-[0.84] lowercase text-white max-w-5xl">
              savant is a system of perception
            </h1>

            <p className="mt-8 max-w-3xl text-lg md:text-2xl leading-[1.65] text-white/58 lowercase">
              not a thin layer of branding. not a decorative website. not a set
              of isolated screens pretending to be strategic. savant is a
              continuously refined interface atmosphere for people who need
              structure, force, clarity, and something that actually feels like
              intelligence.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/cognition"
                className="px-6 py-4 rounded-full bg-gold text-black font-mono text-[10px] tracking-[0.28em] lowercase"
              >
                enter cognition
              </Link>
              <Link
                to="/systems"
                className="px-6 py-4 rounded-full border border-white/10 bg-white/5 text-white font-mono text-[10px] tracking-[0.28em] lowercase"
              >
                inspect systems
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...sectionTransition, delay: 0.1 }}
            className="md:col-span-4"
          >
            <div className="glass-panel rounded-[2rem] p-6 md:p-8">
              <div className="font-mono text-[10px] tracking-[0.34em] text-white/25 lowercase mb-5">
                current field
              </div>
              <div className="space-y-4">
                {[
                  ['focus', 'elevated'],
                  ['coherence', 'stable'],
                  ['direction', 'aggressive'],
                  ['surface noise', 'suppressed'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 border-b border-white/6 pb-3">
                    <span className="text-white/35 lowercase">{k}</span>
                    <span className="text-white lowercase">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section
        data-snap-section="true"
        className="min-h-[100svh] savant-page-container flex items-center"
      >
        <div className="max-w-7xl mx-auto w-full savant-stack">
          <SectionHeader
            label="orientation"
            title="the site now has chambers instead of generic pages"
            copy="each page should feel like it belongs to the same organism while still having its own internal logic. one page thinks. one page diagrams. one page experiments. one page transmits. one page remembers."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="cognition"
              value="thinking surfaces"
              copy="live structures, perceptual overlays, node behavior, and interfaces that feel like they are observing as much as they are displaying."
            />
            <MetricCard
              title="systems"
              value="architectural logic"
              copy="a clearer explanation of what savant actually is, how it is built, and why each layer exists."
            />
            <MetricCard
              title="lab"
              value="active experiments"
              copy="controlled deviations, prototype interactions, visual tests, and things that are too alive to be buried in static case-study pages."
            />
          </div>
        </div>
      </section>

      <section
        data-snap-section="true"
        className="min-h-[100svh] savant-page-container flex items-center"
      >
        <div className="max-w-7xl mx-auto w-full savant-grid items-start">
          <div className="md:col-span-6">
            <SectionHeader
              label="doctrine"
              title="less filler. more force."
              copy="the content has to stop sounding like an agency brochure written by a sedated intern. it should read like a controlled declaration from something that knows exactly what it is doing and why it is built that way."
            />
          </div>

          <div className="md:col-span-6 grid grid-cols-1 gap-6">
            {[
              {
                title: 'signal extraction',
                copy: 'savant isolates the few meaningful structural truths inside crowded, decorative, or contradictory environments and then builds around those truths instead of around trends.',
              },
              {
                title: 'recursive identity',
                copy: 'the strongest brands are not made of a logo and a color. they are made of repeated decisions that all sound like the same intelligence making them.',
              },
              {
                title: 'interface atmosphere',
                copy: 'users do not just read interfaces. they absorb them. the mood, timing, pressure, spacing, and motion become part of the message whether you design them consciously or not.',
              },
            ].map((item) => (
              <div key={item.title} className="glass-panel rounded-[2rem] p-6 md:p-8">
                <div className="text-2xl font-black tracking-[-0.04em] text-white lowercase mb-4">
                  {item.title}
                </div>
                <p className="text-white/50 leading-[1.75] lowercase">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        data-snap-section="true"
        className="min-h-[100svh] savant-page-container flex items-center"
      >
        <div className="max-w-7xl mx-auto w-full">
          <SectionHeader
            label="next chambers"
            title="the structure is now built to expand without collapsing into sameness"
            copy="you wanted more pages with real purpose. these are not just extra links. they are separate modes of seeing the same system."
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[
              ['cognition', '/cognition', 'live perceptual behavior and node logic'],
              ['systems', '/systems', 'the full architecture and operational grammar'],
              ['interface', '/interface', 'display doctrine, motion logic, and interaction language'],
              ['lab', '/lab', 'unstable prototypes and controlled experiments'],
              ['signal', '/signal', 'written transmissions, thoughts, and fragments'],
              ['archive', '/archive', 'memory, progression, and project residues'],
            ].map(([title, href, copy]) => (
              <Link
                key={title}
                to={href}
                className="glass-panel rounded-[2rem] p-6 md:p-8 transition-all duration-500 hover:border-gold/30 hover:bg-white/[0.04]"
              >
                <div className="font-mono text-[10px] tracking-[0.32em] text-white/25 lowercase mb-4">
                  chamber
                </div>
                <div className="text-2xl font-black tracking-[-0.04em] text-white lowercase mb-3">
                  {title}
                </div>
                <p className="text-white/50 leading-[1.7] lowercase">{copy}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}