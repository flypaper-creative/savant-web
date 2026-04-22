import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Layers, Zap, Cpu, Shield, ArrowRight, Activity, Database, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

const RevealText = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <div className="overflow-hidden">
    <motion.div
      initial={{ y: "100%" }}
      whileInView={{ y: 0 }}
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
      title: "Holistic Architecture",
      desc: "We don't just design interfaces; we architect entire operational realities. By auditing your business model, we identify systemic inefficiencies and engineer comprehensive solutions that elevate your brand from the core outward.",
      icon: Layers
    },
    {
      id: "02",
      title: "Carte Blanche Design",
      desc: "True innovation requires absolute trust. We operate on a carte blanche model, unshackled by conventional client briefs. You provide the objective; we provide the unprecedented solution.",
      icon: Zap
    },
    {
      id: "03",
      title: "Proprietary Ecosystems",
      desc: "We build bespoke digital ecosystems tailored exclusively to your operational needs. No templates. No standard libraries. Only elite, proprietary architecture designed for market dominance.",
      icon: Cpu
    },
    {
      id: "04",
      title: "Sovereign Infrastructure",
      desc: "Security and data sovereignty are foundational. We engineer impenetrable digital fortresses, ensuring your assets and operations remain entirely under your control.",
      icon: Shield
    }
  ];

  return (
    <div ref={containerRef} className="w-full bg-obsidian text-white min-h-screen">
      {/* --- HEADER --- */}
      <header className="relative h-[80vh] w-full flex flex-col justify-center px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 noise-overlay opacity-10" />
        
        <motion.div 
          style={{ y: y1, opacity }}
          className="relative z-10 max-w-5xl"
        >
          <div className="font-mono text-[10px] md:text-xs text-gold tracking-[0.5em] md:tracking-[1em] uppercase font-bold mb-8">
            <RevealText>Methodology</RevealText>
          </div>
          
          <h1 className="text-massive title-serif leading-[0.8] tracking-tighter uppercase">
            <RevealText>DEEP</RevealText>
            <RevealText delay={0.1}>FRACTAL</RevealText>
            <RevealText delay={0.2}><span className="text-gold italic">SYSTEMS.</span></RevealText>
          </h1>
          
          <div className="mt-12 max-w-2xl">
            <RevealText delay={0.3}>
              <p className="text-lg md:text-2xl text-white/60 font-light leading-relaxed">
                Going far deeper than traditional design studios. We analyze, deconstruct, and rebuild your company's digital presence to make it undeniably strong, efficient, and ideal in its field.
              </p>
            </RevealText>
          </div>
        </motion.div>
      </header>

      {/* --- SERVICES LIST --- */}
      <section className="py-20 px-6 md:px-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-8">
            {services.map((service, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, delay: i * 0.1 }}
                className="group relative border-t border-white/10 pt-12 pb-20 flex flex-col md:flex-row justify-between items-start gap-12 hover:bg-white/[0.02] transition-colors duration-500 px-8 -mx-8 rounded-3xl"
              >
                <div className="flex items-start gap-8 md:w-1/3">
                  <span className="font-mono text-sm text-gold tracking-widest mt-2">{service.id}</span>
                  <h2 className="text-4xl md:text-5xl title-serif">{service.title}</h2>
                </div>
                
                <div className="md:w-1/2 flex flex-col gap-8">
                  <p className="text-xl text-white/50 font-light leading-relaxed">
                    {service.desc}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-gold group-hover:bg-gold/10 transition-all duration-500">
                      <service.icon className="w-5 h-5 text-white/40 group-hover:text-gold transition-colors" />
                    </div>
                    <span className="font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase group-hover:text-white transition-colors">
                      Explore Protocol
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- METRICS / PROOF --- */}
      <section className="py-40 px-6 md:px-12 bg-gunmetal relative overflow-hidden">
        <div className="absolute inset-0 scanlines-overlay opacity-20" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="savant-grid">
            <div className="md:col-span-5">
              <h2 className="text-5xl md:text-7xl title-serif leading-none tracking-tighter mb-8">
                ENGINEERED<br/>FOR <span className="text-gold italic">DOMINANCE.</span>
              </h2>
              <p className="text-xl text-white/40 font-light leading-relaxed mb-12">
                Our systems are built to scale infinitely while maintaining absolute precision. We don't guess; we measure, optimize, and dominate.
              </p>
            </div>
            
            <div className="md:col-span-6 md:col-start-7 grid grid-cols-2 gap-8">
              {[
                { label: "System Uptime", value: "99.99%", icon: Activity },
                { label: "Data Sovereignty", value: "AES-256", icon: Database },
                { label: "Latency", value: "< 0.1ms", icon: Zap },
                { label: "Architecture", value: "FRACTAL", icon: Terminal }
              ].map((metric, i) => (
                <div key={i} className="glass-panel p-8 rounded-3xl flex flex-col gap-6">
                  <metric.icon className="w-8 h-8 text-gold opacity-50" />
                  <div>
                    <div className="text-3xl font-mono text-white mb-2">{metric.value}</div>
                    <div className="font-mono text-[9px] text-white/40 tracking-[0.2em] uppercase">{metric.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}