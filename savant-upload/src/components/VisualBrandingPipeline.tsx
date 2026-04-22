import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { Magnetic } from './Magnetic';
import Glow from './Glow';
import { GeometricSymbol } from './GeometricSymbol';

export const VisualBrandingPipeline = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  const springScale = useSpring(scale, { stiffness: 100, damping: 30 });

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden py-40 bg-obsidian"
    >
      <motion.div 
        style={{ scale: springScale, opacity, y }}
        className="container mx-auto px-6 relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "circOut" }}
              className="space-y-10"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-[1px] bg-neon-pink" />
                <span className="font-mono text-[11px]  tracking-[0.5em] text-neon-pink font-bold">
                  Visual_Branding_Pipeline_v8.2
                </span>
              </div>
              
              <h2 className="text-massive font-display leading-[0.85] tracking-tighter">
                THE GENETIC <br />
                <span className="text-neon-pink italic font-serif font-light">CODE</span> <br />
                OF SAVANT
              </h2>
              
              <p className="text-2xl text-white/50 max-w-lg leading-relaxed font-light">
                Our visual identity is a living algorithm. It adapts, mutates, and evolves 
                in real-time, reflecting the sovereign intelligence at our core.
              </p>

              <div className="grid grid-cols-2 gap-12 pt-10">
                {[
                  { label: "COGNITIVE_LOAD", value: "92%", color: "text-neon-pink" },
                  { label: "NEURAL_SYNC", value: "0.998", color: "text-white" },
                  { label: "TRUTH_ANCHOR", value: "STABLE", color: "text-emerald-400" },
                  { label: "ENTROPY_RATE", value: "0.0012", color: "text-gold" }
                ].map((stat, i) => (
                  <div key={i} className="space-y-3 group/stat">
                    <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] group-hover/stat:text-white/40 transition-colors">
                      {stat.label}
                    </div>
                    <div className={`text-3xl font-mono font-black tracking-tighter ${stat.color}`}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="relative aspect-square">
            <Glow color="rgba(255,64,104,0.2)" blur="150px" opacity={0.6}>
              <div className="relative w-full h-full flex items-center justify-center">
                <Magnetic strength={0.2}>
                  <div className="relative w-full h-full flex items-center justify-center p-20">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border border-white/5 rounded-full"
                    />
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-10 border border-neon-pink/10 rounded-full border-dashed"
                    />
                    
                    <div className="relative z-10 w-full h-full overflow-visible">
                      <GeometricSymbol />
                    </div>

                    {/* Orbiting Neural Nodes */}
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_#fff]"
                        animate={{
                          rotate: 360,
                        }}
                        style={{
                          left: '50%',
                          top: '50%',
                          transformOrigin: `${Math.cos(i * 30) * 200}px ${Math.sin(i * 30) * 200}px`
                        }}
                        transition={{
                          rotate: { duration: 15 + i, repeat: Infinity, ease: "linear" }
                        }}
                      />
                    ))}
                  </div>
                </Magnetic>
              </div>
            </Glow>
          </div>
        </div>
      </motion.div>

      {/* Background Text Rails */}
      <div className="absolute top-1/2 left-12 -translate-y-1/2 vertical-text rotate-180 font-mono text-[9px] text-white/5 tracking-[1em] uppercase">
        SAVANT_OS_VISUAL_IDENTITY_SYSTEM_v8.2.0_DNA_SEQUENCE_LOCKED_TRUTH_ANCHOR_STABLE
      </div>
      <div className="absolute top-1/2 right-12 -translate-y-1/2 vertical-text font-mono text-[9px] text-white/5 tracking-[1em] uppercase">
        NEURAL_LATTICE_INTEGRATION_ACTIVE_RECURSIVE_GEOMETRY_OPTIMIZED_FOR_DOMINANCE
      </div>
    </section>
  );
};
