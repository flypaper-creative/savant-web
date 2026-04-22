import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { ArrowUpRight, X } from 'lucide-react';

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

const WorkItem = ({ work, index, onClick }: { work: any, index: number, onClick: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.9]);

  return (
    <motion.div 
      ref={ref}
      style={{ scale }}
      className="relative w-full h-screen flex items-center justify-center py-20 group cursor-pointer"
      onClick={onClick}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[3rem] mx-6 md:mx-12">
        <motion.img 
          style={{ y }}
          src={work.img} 
          alt={work.title} 
          className="w-full h-[120%] object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
        />
        <div className="absolute inset-0 bg-obsidian/40 group-hover:bg-obsidian/10 transition-colors duration-1000" />
      </div>

      <div className="relative z-10 text-center pointer-events-none">
        <div className="font-mono text-xs text-gold tracking-[0.5em] uppercase mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
          {work.category}
        </div>
        <h2 className="text-huge title-serif text-white leading-none tracking-tighter mix-blend-difference">
          {work.title}
        </h2>
      </div>

      <div className="absolute bottom-12 right-16 z-20 w-20 h-20 rounded-full bg-gold flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-out">
        <ArrowUpRight className="w-8 h-8 text-obsidian" />
      </div>
    </motion.div>
  );
};

export default function Work() {
  const [selectedWork, setSelectedWork] = useState<any>(null);

  const works = [
    { 
      id: '01', 
      title: 'OBLIVION', 
      category: 'Identity System', 
      desc: 'A comprehensive brand transformation for a leading luxury house, redefining elegance for the digital elite.', 
      img: 'https://picsum.photos/seed/oblivion/1920/1080',
    },
    { 
      id: '02', 
      title: 'LATTICE', 
      category: 'Neural Architecture', 
      desc: 'A high-energy, kinetic advertising campaign that captured global attention and drove unprecedented growth.', 
      img: 'https://picsum.photos/seed/lattice/1920/1080',
    },
    { 
      id: '03', 
      title: 'VOID', 
      category: 'Strategic Framework', 
      desc: 'Meticulous design systems engineered to translate complex strategies into powerful visual geometry.', 
      img: 'https://picsum.photos/seed/void/1920/1080',
    }
  ];

  return (
    <div className="w-full bg-obsidian text-white min-h-screen">
      {/* --- HEADER --- */}
      <header className="relative h-[60vh] w-full flex flex-col justify-center px-6 md:px-12">
        <div className="max-w-5xl">
          <div className="font-mono text-[10px] md:text-xs text-gold tracking-[0.5em] md:tracking-[1em] uppercase font-bold mb-8">
            <RevealText>The Archive</RevealText>
          </div>
          
          <h1 className="text-massive title-serif leading-[0.8] tracking-tighter uppercase">
            <RevealText>SELECTED</RevealText>
            <RevealText delay={0.1}><span className="text-gold italic">ARTIFACTS.</span></RevealText>
          </h1>
        </div>
      </header>

      {/* --- WORK LIST --- */}
      <section className="pb-40">
        {works.map((work, index) => (
          <WorkItem 
            key={work.id} 
            work={work} 
            index={index} 
            onClick={() => setSelectedWork(work)} 
          />
        ))}
      </section>

      {/* --- MODAL --- */}
      <AnimatePresence>
        {selectedWork && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-obsidian flex flex-col"
          >
            <div className="absolute inset-0">
              <img src={selectedWork.img} alt={selectedWork.title} className="w-full h-full object-cover opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/80 to-transparent" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-end p-12 md:p-24">
              <button 
                onClick={() => setSelectedWork(null)}
                className="absolute top-12 right-12 w-16 h-16 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-obsidian transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="max-w-4xl">
                <div className="font-mono text-xs text-gold tracking-[0.5em] uppercase mb-8">
                  {selectedWork.category}
                </div>
                <h2 className="text-huge title-serif leading-none tracking-tighter mb-12">
                  {selectedWork.title}
                </h2>
                <p className="text-2xl text-white/60 font-light leading-relaxed mb-12">
                  {selectedWork.desc}
                </p>
                <button className="px-12 py-6 rounded-full bg-white text-obsidian font-mono text-xs tracking-widest uppercase hover:bg-gold transition-colors">
                  Explore Case Study
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}