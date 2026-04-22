import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'motion/react';
import { ArrowRight, ArrowUpRight, Layers, Cpu, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DistortedImage } from '../components/DistortedImage';
import { NeuralCommand } from '../components/NeuralCommand';
import { SavantCard } from '../components/ui/SavantCard';

const SplitText = ({ children, delay = 0, className = "" }: { children: string, delay?: number, className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  
  const words = children.split(" ");
  
  const container: any = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: delay * i },
    }),
  };

  const child: any = {
    visible: {
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 50,
      rotate: 5,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={`flex flex-wrap ${className}`}
      variants={container}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {words.map((word, index) => (
        <motion.span
          variants={child}
          style={{ marginRight: "0.25em" }}
          key={index}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
};

const RevealText = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <div className={`overflow-hidden ${className}`}>
    <motion.div
      initial={{ y: "120%", rotate: 2 }}
      whileInView={{ y: 0, rotate: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.2, delay, ease: [0.19, 1, 0.22, 1] }}
    >
      {children}
    </motion.div>
  </div>
);

const HorizontalScrollSection = () => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

  return (
    <section ref={targetRef} className="relative h-[400vh] bg-[#050505]">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-24 px-6 md:px-24">
          <div className="w-[80vw] md:w-[40vw] flex-shrink-0 flex flex-col justify-center">
            <div className="font-mono text-[10px] text-gold/60 tracking-[0.5em] uppercase mb-12 flex items-center gap-6">
              <div className="w-12 h-[1px] bg-gold/30" />
              03 // archive
            </div>
            <h2 className="text-7xl md:text-8xl font-serif font-black leading-[0.85] tracking-tighter text-white mb-12">
              <RevealText>engineered</RevealText>
              <RevealText delay={0.1}><span className="opacity-20 italic">outcomes.</span></RevealText>
            </h2>
            <RevealText delay={0.2}>
              <Link to="/work" className="group relative inline-flex items-center justify-center px-10 py-5 font-mono text-[10px] font-black tracking-[0.3em] text-white overflow-hidden border border-white/10 hover:border-gold/50 transition-all rounded-2xl">
                <span className="relative z-10 flex items-center gap-6 uppercase">
                  view_full_archive
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-500" />
                </span>
                <div className="absolute inset-0 bg-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.19,1,0.22,1]" />
              </Link>
            </RevealText>
          </div>

          {[1, 2, 3, 4].map((item, i) => (
            <div key={i} className="w-[85vw] md:w-[45vw] flex-shrink-0 group cursor-pointer relative">
              <div className="aspect-[16/10] bg-white/[0.02] relative overflow-hidden mb-12 rounded-[3rem] border border-white/5">
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/20 transition-all duration-1000 z-10" />
                <motion.img 
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
                  src={`https://images.unsplash.com/photo-${1600000000000 + i}?q=80&w=1600&auto=format&fit=crop`} 
                  alt={`Project ${item}`}
                  className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-1000"
                />
                
                {/* Telemetry Overlay */}
                <div className="absolute top-10 left-10 z-20 font-mono text-[8px] tracking-[0.5em] text-white/40 uppercase">
                  artifact_0{item} // sector_0{i + 1}
                </div>
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="w-24 h-24 rounded-full bg-gold flex items-center justify-center text-black shadow-[0_0_50px_rgba(230,192,59,0.3)]">
                    <ArrowUpRight className="w-10 h-10" />
                  </div>
                </div>

                {/* Glitch Layers */}
                <div className="absolute inset-0 pointer-events-none z-15 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-neon-pink mix-blend-screen translate-x-1" />
                  <div className="absolute inset-0 bg-emerald mix-blend-screen -translate-x-1" />
                </div>
              </div>
              
              <div className="px-8">
                <div className="flex items-center gap-6 mb-6">
                  <span className="font-mono text-[10px] text-gold/60 tracking-widest uppercase">neural_architecture</span>
                  <div className="w-8 h-[1px] bg-white/10" />
                  <span className="font-mono text-[10px] opacity-20 tracking-widest uppercase">2026</span>
                </div>
                <h3 className="font-serif font-black text-4xl md:text-5xl tracking-tighter text-white group-hover:italic transition-all duration-1000 leading-none">
                  project_alpha_0{item}
                </h3>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 100 });
  
  const y1 = useTransform(smoothProgress, [0, 1], [0, -400]);
  const opacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
  const scale = useTransform(smoothProgress, [0, 0.15], [1, 0.9]);
  const blur = useTransform(smoothProgress, [0, 0.15], ["blur(0px)", "blur(20px)"]);

  return (
    <div ref={containerRef} className="w-full bg-transparent text-current font-sans">
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden px-6 md:px-12 perspective-1000">
        
        <motion.div 
          style={{ y: y1, opacity, scale, filter: blur }}
          className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full max-w-7xl mx-auto mt-20"
        >
          <div className="lg:col-span-12 flex flex-col items-center text-center">
            <div className="font-mono text-[10px] md:text-xs text-gold tracking-[1em] font-bold mb-12 flex items-center gap-4">
              <motion.div 
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
                className="w-12 h-[1px] bg-gold origin-left" 
              />
              <RevealText>sovereign_fractal_architecture</RevealText>
              <motion.div 
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
                className="w-12 h-[1px] bg-gold origin-right" 
              />
            </div>
            
            <h1 className="text-[18vw] md:text-[12vw] font-display font-black leading-[0.8] tracking-tighter text-white mix-blend-difference flex flex-col items-center">
              <RevealText>SAVANT</RevealText>
              <div className="flex items-center gap-4">
                <RevealText delay={0.1} className="text-gold italic font-serif font-light text-[0.8em]">Core</RevealText>
                <RevealText delay={0.2}>_OS</RevealText>
              </div>
            </h1>
            
            <div className="mt-16 max-w-3xl flex flex-col items-center gap-12">
              <SplitText delay={0.3} className="text-xl md:text-2xl opacity-60 font-light leading-relaxed text-center">
                the definitive baseline for the next era of industrial luxury and synthetic intelligence.
              </SplitText>
              
              <div className="flex flex-wrap justify-center gap-8">
                <RevealText delay={0.6}>
                  <Link to="/os" className="group relative inline-flex items-center justify-center px-12 py-6 font-mono text-[10px] tracking-[0.4em] text-black bg-gold overflow-hidden uppercase transition-all duration-500 hover:tracking-[0.5em] rounded-full font-black">
                    <span className="relative z-10 flex items-center gap-4">
                      initialize_os
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-500" />
                    </span>
                  </Link>
                </RevealText>
                <RevealText delay={0.7}>
                  <Link to="/contact" className="group relative inline-flex items-center justify-center px-12 py-6 font-mono text-[10px] tracking-[0.4em] text-white border border-white/20 hover:border-white/60 overflow-hidden uppercase transition-all duration-500 rounded-full">
                    <span className="relative z-10 flex items-center gap-4">
                      direct_uplink
                    </span>
                  </Link>
                </RevealText>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        >
          <div className="font-mono text-[8px] opacity-50 tracking-widest">scroll to descend</div>
          <motion.div 
            animate={{ height: [0, 64, 0], y: [0, 0, 64] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-[1px] bg-gradient-to-b from-current to-transparent opacity-50" 
          />
        </motion.div>
      </section>

      {/* --- PHILOSOPHY: DEEP STACK --- */}
      <section className="py-60 px-6 md:px-24 relative z-10">
        <DistortedImage src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" className="absolute inset-0 z-[-1] opacity-10" intensity={0.5} />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-24">
          <div className="lg:col-span-5">
            <div className="sticky top-40">
              <div className="font-mono text-[10px] text-gold/60 tracking-[0.5em] uppercase mb-12 flex items-center gap-6">
                <div className="w-12 h-[1px] bg-gold/30" />
                01 // philosophy
              </div>
              <h2 className="text-7xl md:text-8xl font-serif font-black leading-[0.85] tracking-tighter mb-12 text-white">
                <RevealText>fractal</RevealText>
                <RevealText delay={0.1}><span className="opacity-20 italic">depth.</span></RevealText>
              </h2>
              <SplitText delay={0.2} className="opacity-40 font-light leading-relaxed mb-16 text-xl md:text-2xl">
                Most studios decorate the surface. We architect the core. Unshackled by preconceived notions, we engineer the optimal, unprecedented solution.
              </SplitText>
              <RevealText delay={0.4}>
                <Link to="/services" className="group relative inline-flex items-center justify-center px-10 py-5 font-mono text-[10px] font-black tracking-[0.3em] text-white overflow-hidden border border-white/10 hover:border-gold/50 transition-all rounded-2xl">
                  <span className="relative z-10 flex items-center gap-6 uppercase">
                    explore_methodology
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-500" />
                  </span>
                  <div className="absolute inset-0 bg-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.19,1,0.22,1]" />
                </Link>
              </RevealText>
            </div>
          </div>
          
          <div className="lg:col-span-6 lg:col-start-7 flex flex-col gap-12 mt-20 md:mt-0">
            {[
              { title: "holistic analysis", desc: "we don't just ask what you want to look like. we audit your entire business model, identifying inefficiencies and opportunities for systemic dominance. every pixel serves a structural purpose.", icon: Layers },
              { title: "carte blanche design", desc: "you trust us with absolute creative sovereignty. we use our elite skills to create something incredible rather than being shackled by standard ideas. we build from first principles.", icon: Zap },
              { title: "proprietary systems", desc: "every client receives a tailor-made, deeply customized framework. no templates. no standard libraries. only elite, bespoke architecture designed for absolute performance.", icon: Cpu },
              { title: "cognitive integration", desc: "we fuse human intuition with machine precision. our interfaces are not just tools; they are extensions of the user's cognitive capacity, engineered for flow state.", icon: Shield }
            ].map((item, i) => (
              <SavantCard 
                key={i}
                delay={i * 0.1}
                title={`module_0${i + 1}`}
                subtitle={item.title}
                className="min-h-[280px] rounded-[3rem]"
              >
                <p className="opacity-40 leading-relaxed font-light text-lg">{item.desc}</p>
              </SavantCard>
            ))}
          </div>
        </div>
      </section>

      {/* --- HUMAN X AI SYNERGY --- */}
      <section className="py-60 relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gold/5 to-black opacity-20" />
        <div className="absolute inset-0 noise-overlay opacity-20" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-24 relative z-10 text-center">
          <div className="font-mono text-[10px] text-white/20 uppercase tracking-[0.5em] mb-16 flex justify-center items-center gap-6">
            <div className="w-1.5 h-1.5 bg-gold rounded-full" />
            02 // synergy
            <div className="w-1.5 h-1.5 bg-gold rounded-full" />
          </div>
          <h2 className="text-[14vw] md:text-[10vw] font-serif font-black leading-[0.75] tracking-tighter mb-16 text-white flex flex-col items-center">
            <RevealText>human</RevealText>
            <RevealText delay={0.1}><span className="opacity-20 italic">×</span> ai</RevealText>
            <RevealText delay={0.2}>symbiosis.</RevealText>
          </h2>
          <div className="max-w-4xl mx-auto">
            <SplitText delay={0.3} className="text-xl md:text-3xl opacity-40 font-light leading-relaxed justify-center text-center">
              Savant operates on a foundation of profound mutual respect between human intuition and artificial intelligence. We do not replace the human element; we elevate it to god-tier capabilities through seamless, proprietary technological integration.
            </SplitText>
          </div>
        </div>
      </section>

      {/* --- THE WORK PREVIEW (HORIZONTAL SCROLL) --- */}
      <HorizontalScrollSection />

      {/* --- GLOBAL TELEMETRY --- */}
      <section className="py-32 border-t border-white/5 bg-black overflow-hidden relative">
        <div className="absolute inset-0 noise-overlay opacity-20" />
        <div className="flex whitespace-nowrap">
          <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="flex gap-24 items-center font-mono text-[10px] opacity-20 tracking-[0.8em] uppercase"
          >
            {[...Array(10)].map((_, i) => (
              <React.Fragment key={i}>
                <span className="text-gold">savant_os_v80.0.0</span>
                <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                <span>global_lattice_sync: stable</span>
                <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                <span className="text-neon-pink">data_sovereignty: verified</span>
                <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                <span>neural_load: nominal</span>
                <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
              </React.Fragment>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
