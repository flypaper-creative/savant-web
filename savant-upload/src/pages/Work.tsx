import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useInView } from 'motion/react';
import { ArrowUpRight, X } from 'lucide-react';
import { DistortedImage } from '../components/DistortedImage';
import { WebGLGallery } from '../components/WebGLGallery';
import { Magnetic } from '../components/Magnetic';

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

const WorkItem = ({ work, index, onClick }: { work: any, index: number, onClick: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1, 0.85]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <motion.div 
      ref={ref}
      style={{ scale, opacity }}
      className="relative w-full h-[85vh] md:h-screen flex items-center justify-center py-24 group cursor-pointer perspective-2000"
      onClick={onClick}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] md:rounded-[4rem] mx-6 md:mx-16 border border-white/5 shadow-2xl">
        {/* Base Image */}
        <motion.img 
          style={{ y }}
          src={work.img} 
          alt={work.title} 
          className="w-full h-[130%] object-cover grayscale opacity-40 group-hover:opacity-100 transition-all duration-1000 ease-[0.19,1,0.22,1]"
        />
        
        {/* Slices for Glitch Effect */}
        {[0, 1, 2].map((i) => (
          <motion.div 
            key={i}
            className="absolute inset-0 overflow-hidden pointer-events-none"
            initial={{ clipPath: `polygon(0 ${i * 33.3}%, 100% ${i * 33.3}%, 100% ${i * 33.3}%, 0 ${i * 33.3}%)` }}
            whileHover={{ clipPath: `polygon(0 ${i * 33.3}%, 100% ${i * 33.3}%, 100% ${(i + 1) * 33.3}%, 0 ${(i + 1) * 33.3}%)` }}
            transition={{ duration: 0.8, delay: i * 0.05, ease: [0.19, 1, 0.22, 1] }}
          >
            <motion.img 
              style={{ y, scale: 1.05 + i * 0.05 }}
              src={work.img} 
              alt="" 
              className="w-full h-[130%] object-cover grayscale-0"
            />
          </motion.div>
        ))}

        <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-1000" />
        
        {/* Telemetry Overlay */}
        <div className="absolute inset-0 p-12 flex flex-col justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="flex justify-between items-start font-mono text-[8px] tracking-[0.4em] text-white/40 uppercase">
            <div className="flex flex-col gap-2">
              <span>artifact_id: {work.id}</span>
              <span>status: archived</span>
            </div>
            <div className="flex flex-col gap-2 text-right">
              <span>coord_z: 0.042</span>
              <span>encryption: active</span>
            </div>
          </div>
          <div className="flex justify-between items-end font-mono text-[8px] tracking-[0.4em] text-white/40 uppercase">
            <span>savant_os // archive_v80</span>
            <span>neural_sync: 100%</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 text-center pointer-events-none flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="font-mono text-[10px] text-gold tracking-[0.5em] uppercase mb-8"
        >
          {work.category}
        </motion.div>
        <div className="overflow-hidden">
          <motion.h2 
            className="text-[18vw] md:text-[12vw] font-display font-black text-white leading-none tracking-tighter mix-blend-difference group-hover:italic transition-all duration-1000"
          >
            {work.title}
          </motion.h2>
        </div>
      </div>

      <div className="absolute bottom-16 right-20 z-20">
        <Magnetic strength={0.8}>
          <div className="w-32 h-32 rounded-full border border-white/20 flex items-center justify-center transform scale-0 group-hover:scale-100 transition-all duration-700 ease-[0.19,1,0.22,1] backdrop-blur-2xl cursor-pointer pointer-events-auto">
            <div className="absolute inset-0 bg-gold/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
            <ArrowUpRight className="w-12 h-12 text-white relative z-10" />
          </div>
        </Magnetic>
      </div>
    </motion.div>
  );
};

export default function Work() {
  const [selectedWork, setSelectedWork] = useState<any>(null);

  const works = [
    { 
      id: '01', 
      title: 'oblivion', 
      category: 'identity system', 
      desc: 'a comprehensive brand transformation for a leading luxury house, redefining elegance for the digital elite.', 
      img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop',
    },
    { 
      id: '02', 
      title: 'lattice', 
      category: 'neural architecture', 
      desc: 'a high-energy, kinetic advertising campaign that captured global attention and drove unprecedented growth.', 
      img: 'https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=2574&auto=format&fit=crop',
    },
    { 
      id: '03', 
      title: 'void', 
      category: 'strategic framework', 
      desc: 'meticulous design systems engineered to translate complex strategies into powerful visual geometry.', 
      img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2670&auto=format&fit=crop',
    }
  ];

  return (
    <div className="w-full min-h-screen bg-black text-white relative overflow-x-hidden">
      <WebGLGallery items={works} />
      
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
            archive_telemetry // v80.0_kernel
          </motion.div>
          
          <h1 className="text-[18vw] md:text-[14vw] font-serif leading-[0.75] tracking-tighter mb-12">
            <RevealText>selected</RevealText>
            <RevealText delay={0.1}><span className="opacity-20 italic">artifacts.</span></RevealText>
          </h1>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <RevealText delay={0.3}>
              <p className="max-w-xl text-xl md:text-2xl opacity-40 font-light leading-relaxed">
                A curated collection of sovereign digital experiences, engineered for the next era of industrial luxury.
              </p>
            </RevealText>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="flex items-center gap-8"
            >
              <div className="flex flex-col items-end">
                <span className="font-mono text-[10px] text-white/20 uppercase tracking-widest">total_artifacts</span>
                <span className="font-mono text-xl font-black text-gold">042</span>
              </div>
              <div className="w-[1px] h-12 bg-white/10" />
              <div className="flex flex-col items-end">
                <span className="font-mono text-[10px] text-white/20 uppercase tracking-widest">last_archived</span>
                <span className="font-mono text-xl font-black text-neon-pink">2026.04.10</span>
              </div>
            </motion.div>
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

      {/* --- WORK GALLERY --- */}
      <section className="pb-40 relative z-10">
        <div className="flex flex-col gap-[40vh]">
          {works.map((work, index) => (
            <div key={work.id} className="h-screen flex items-center justify-center">
              <WorkItem 
                work={work} 
                index={index} 
                onClick={() => setSelectedWork(work)} 
              />
            </div>
          ))}
        </div>
      </section>

      {/* --- MODAL --- */}
      <AnimatePresence>
        {selectedWork && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-12"
          >
            <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setSelectedWork(null)} />
            
            <motion.div 
              initial={{ y: 100, scale: 0.9, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 100, scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="relative w-full max-w-6xl bg-white/[0.02] border border-white/10 rounded-[3rem] md:rounded-[4rem] overflow-hidden flex flex-col md:flex-row shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            >
              <div className="w-full md:w-3/5 h-80 md:h-auto relative overflow-hidden">
                <img src={selectedWork.img} alt={selectedWork.title} className="absolute inset-0 w-full h-full object-cover grayscale" />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 noise-overlay opacity-20" />
                
                {/* Image Telemetry */}
                <div className="absolute top-10 left-10 font-mono text-[8px] text-white/40 tracking-[0.5em] uppercase">
                  artifact_id: {selectedWork.id} // sector_01
                </div>
              </div>
              
              <div className="w-full md:w-2/5 p-12 md:p-20 flex flex-col justify-center relative">
                <div className="absolute inset-0 noise-overlay opacity-5 pointer-events-none" />
                
                <div className="font-mono text-[10px] text-gold/60 tracking-[0.5em] mb-10 uppercase">
                  {selectedWork.category}
                </div>
                <h3 className="text-5xl md:text-7xl font-serif font-black tracking-tighter mb-10 text-white leading-[0.85]">
                  {selectedWork.title}
                </h3>
                <p className="text-xl opacity-40 font-light leading-relaxed mb-16 text-white">
                  {selectedWork.desc}
                </p>
                
                <button className="self-start group relative inline-flex items-center justify-center px-10 py-5 font-mono text-[10px] font-black tracking-[0.3em] text-white overflow-hidden border border-white/10 hover:border-gold/50 transition-all rounded-2xl">
                  <span className="relative z-10 flex items-center gap-6">
                    VIEW_CASE_STUDY
                    <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500" />
                  </span>
                  <div className="absolute inset-0 bg-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.19,1,0.22,1]" />
                </button>
              </div>

              <button 
                onClick={() => setSelectedWork(null)}
                className="absolute top-10 right-10 w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all z-50 group"
              >
                <X className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
