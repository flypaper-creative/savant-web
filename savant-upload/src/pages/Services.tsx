import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'motion/react';
import { Layers, Zap, Cpu, Shield, ArrowRight, Activity, Database, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DistortedImage } from '../components/DistortedImage';
import { FractalBackground } from '../components/FractalBackground';
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
      transition: { type: "spring", damping: 20, stiffness: 100 },
    },
    hidden: {
      opacity: 0,
      y: 50,
      rotate: 5,
      transition: { type: "spring", damping: 20, stiffness: 100 },
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

const RevealText = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <div className="overflow-hidden">
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

export default function Services() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const services = [
    {
      id: "01",
      title: "holistic architecture",
      desc: "we don't just design interfaces; we architect entire operational realities. by auditing your business model, we identify systemic inefficiencies and engineer comprehensive solutions that elevate your brand from the core outward.",
      icon: Layers,
      telemetry: "sector_01 // root_access"
    },
    {
      id: "02",
      title: "carte blanche design",
      desc: "true innovation requires absolute trust. we operate on a carte blanche model, unshackled by conventional client briefs. you provide the objective; we provide the unprecedented solution.",
      icon: Zap,
      telemetry: "sector_02 // neural_sync"
    },
    {
      id: "03",
      title: "proprietary ecosystems",
      desc: "we build bespoke digital ecosystems tailored exclusively to your operational needs. no templates. no standard libraries. only elite, proprietary architecture designed for market dominance.",
      icon: Cpu,
      telemetry: "sector_03 // core_kernel"
    },
    {
      id: "04",
      title: "sovereign infrastructure",
      desc: "security and data sovereignty are foundational. we engineer impenetrable digital fortresses, ensuring your assets and operations remain entirely under your control.",
      icon: Shield,
      telemetry: "sector_04 // secure_uplink"
    }
  ];

  return (
    <div ref={containerRef} className="w-full min-h-screen bg-black text-white relative overflow-x-hidden">
      <FractalBackground />
      
      {/* --- HERO SECTION --- */}
      <header className="relative h-screen w-full flex flex-col justify-center px-6 md:px-24 overflow-hidden z-10">
        <div className="absolute inset-0 noise-overlay opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        
        <div className="max-w-7xl mx-auto w-full relative">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
            className="font-mono text-[10px] text-gold/60 tracking-[0.5em] uppercase mb-12 flex items-center gap-6"
          >
            <div className="w-12 h-[1px] bg-gold/30" />
            methodology_telemetry // v80.0_kernel
          </motion.div>
          
          <h1 className="text-[18vw] md:text-[14vw] font-serif leading-[0.75] tracking-tighter mb-12">
            <RevealText>deep</RevealText>
            <RevealText delay={0.1}>fractal</RevealText>
            <RevealText delay={0.2}><span className="opacity-20 italic">systems.</span></RevealText>
          </h1>

          <div className="mt-16 max-w-4xl">
            <SplitText delay={0.3} className="text-xl md:text-3xl opacity-40 font-light leading-relaxed">
              Going far deeper than traditional design studios. We analyze, deconstruct, and rebuild your company's digital presence to make it undeniably strong, efficient, and ideal in its field.
            </SplitText>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        >
          <span className="font-mono text-[8px] text-white/20 uppercase tracking-[0.5em]">scroll_to_explore</span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-gold/50 to-transparent" />
        </motion.div>
      </header>

      {/* --- SERVICES LIST --- */}
      <section className="py-40 px-6 md:px-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-12">
            {services.map((service, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.2, delay: i * 0.1, ease: [0.19, 1, 0.22, 1] }}
                className="group relative border-t border-white/5 pt-24 pb-32 flex flex-col md:flex-row justify-between items-start gap-16 hover:bg-white/[0.02] transition-all duration-700 px-12 -mx-12 rounded-[4rem] overflow-hidden"
              >
                {/* Scanlines */}
                <div className="absolute inset-0 pointer-events-none z-0 opacity-0 group-hover:opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] transition-opacity duration-700" />

                <div className="flex items-start gap-12 md:w-1/3 relative z-10">
                  <span className="font-mono text-xs text-gold/60 tracking-[0.5em] mt-4 uppercase">{service.id}</span>
                  <h2 className="text-5xl md:text-7xl font-serif font-black tracking-tighter group-hover:italic transition-all duration-1000 text-white leading-[0.85]">{service.title}</h2>
                </div>
                
                <div className="md:w-1/2 flex flex-col gap-12 relative z-10">
                  <p className="text-2xl opacity-40 font-light leading-relaxed text-white">
                    {service.desc}
                  </p>
                  <div className="flex items-center gap-8 opacity-20 group-hover:opacity-100 transition-all duration-700">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-gold/20 transition-all">
                      <service.icon className="w-8 h-8 text-white group-hover:text-gold" strokeWidth={1} />
                    </div>
                    <div className="h-[1px] flex-grow bg-white/10" />
                    <div className="font-mono text-[9px] tracking-[0.5em] uppercase text-white/40">
                      {service.telemetry}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PROCESS SECTION --- */}
      <section className="py-60 px-6 md:px-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="font-mono text-[9px] text-gold tracking-[0.5em] mb-24 flex items-center gap-6">
            <div className="w-12 h-[1px] bg-gold/30" />
            operational_workflow // bento_grid_v1.0
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8">
              <SavantCard 
                title="module_01" 
                subtitle="deconstruction" 
                className="h-full min-h-[400px] rounded-[3rem]"
              >
                <p className="text-2xl opacity-40 font-light leading-relaxed text-white">
                  we audit every layer of your current operational model, identifying fractal inefficiencies and legacy bottlenecks that hinder sovereign growth.
                </p>
              </SavantCard>
            </div>
            <div className="md:col-span-4">
              <SavantCard 
                title="module_02" 
                subtitle="neural_mapping" 
                className="h-full min-h-[400px] rounded-[3rem]"
              >
                <p className="text-lg opacity-40 font-light leading-relaxed text-white">
                  mapping the neural topology of your brand to ensure absolute coherence across all global sectors.
                </p>
              </SavantCard>
            </div>
            <div className="md:col-span-4">
              <SavantCard 
                title="module_03" 
                subtitle="re-engineering" 
                className="h-full min-h-[400px] rounded-[3rem]"
              >
                <p className="text-lg opacity-40 font-light leading-relaxed text-white">
                  bespoke neural architectures are developed to replace legacy systems with sovereign code.
                </p>
              </SavantCard>
            </div>
            <div className="md:col-span-8">
              <SavantCard 
                title="module_04" 
                subtitle="deployment_&_uplink" 
                className="h-full min-h-[400px] rounded-[3rem]"
              >
                <p className="text-2xl opacity-40 font-light leading-relaxed text-white">
                  seamless integration of the new ecosystem into your global operational framework, secured via quantum-resistant encryption.
                </p>
              </SavantCard>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-60 px-6 md:px-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-12 md:p-24 rounded-[4rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl relative overflow-hidden"
          >
            <div className="absolute inset-0 noise-overlay opacity-10" />
            <h2 className="text-5xl md:text-7xl font-serif font-black tracking-tighter mb-12 text-white leading-[0.85]">
              Ready to <span className="italic opacity-30">initiate</span> the protocol?
            </h2>
            <p className="text-xl opacity-40 font-light leading-relaxed mb-16 max-w-2xl mx-auto">
              Begin the uplink sequence and transform your operational reality today.
            </p>
            
            <Link to="/contact" className="group relative inline-flex items-center justify-center px-12 py-6 font-mono text-[10px] font-black tracking-[0.3em] text-white overflow-hidden border border-white/10 hover:border-gold/50 transition-all rounded-2xl">
              <span className="relative z-10 flex items-center gap-6 uppercase">
                begin_uplink
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500 ease-[0.19,1,0.22,1]" />
              </span>
              <div className="absolute inset-0 bg-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.19,1,0.22,1]" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
