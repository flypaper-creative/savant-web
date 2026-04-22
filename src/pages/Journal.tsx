import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

const RevealText = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <div className="overflow-hidden">
    <motion.div
      initial={{ y: "100%" }}
      whileInView={{ y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, delay, ease: [0.19, 1, 0.22, 1] }}
    >
      {children}
    </motion.div>
  </div>
);

export default function Journal() {
  const posts = [
    {
      id: 1,
      title: "The Architecture of Trust in AI-Driven Systems",
      date: "2026.04.12",
      category: "Philosophy",
      excerpt: "Exploring the fundamental necessity of carte blanche trust when integrating autonomous agents into enterprise-level operational frameworks.",
      img: "https://picsum.photos/seed/journal1/800/600"
    },
    {
      id: 2,
      title: "Fractal Identity: Beyond the Surface Layer",
      date: "2026.03.28",
      category: "Methodology",
      excerpt: "Why traditional branding fails in the modern era, and how deep-stack, systemic identity design creates unshakeable market dominance.",
      img: "https://picsum.photos/seed/journal2/800/600"
    },
    {
      id: 3,
      title: "Sovereign Infrastructure in Web3",
      date: "2026.03.15",
      category: "Engineering",
      excerpt: "A technical deep-dive into building decentralized, impenetrable digital fortresses for high-net-worth operational networks.",
      img: "https://picsum.photos/seed/journal3/800/600"
    }
  ];

  return (
    <div className="w-full bg-obsidian text-white min-h-screen">
      {/* --- HEADER --- */}
      <header className="relative h-[60vh] w-full flex flex-col justify-center px-6 md:px-12 border-b border-white/10">
        <div className="max-w-5xl">
          <div className="font-mono text-[10px] md:text-xs text-gold tracking-[0.5em] md:tracking-[1em] uppercase font-bold mb-8">
            <RevealText>Intel & Insights</RevealText>
          </div>
          
          <h1 className="text-massive title-serif leading-[0.8] tracking-tighter uppercase">
            <RevealText>THE</RevealText>
            <RevealText delay={0.1}><span className="text-gold italic">JOURNAL.</span></RevealText>
          </h1>
        </div>
      </header>

      {/* --- POSTS LIST --- */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col gap-20">
          {posts.map((post, i) => (
            <motion.article 
              key={post.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, delay: i * 0.1 }}
              className="group cursor-pointer savant-grid items-center"
            >
              <div className="md:col-span-5 overflow-hidden rounded-3xl aspect-[4/3]">
                <img 
                  src={post.img} 
                  alt={post.title} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                />
              </div>
              
              <div className="md:col-span-6 md:col-start-7 flex flex-col justify-center">
                <div className="flex items-center gap-6 mb-8">
                  <span className="font-mono text-xs text-gold tracking-widest uppercase">{post.date}</span>
                  <div className="w-12 h-[1px] bg-white/20" />
                  <span className="font-mono text-xs text-white/40 tracking-widest uppercase">{post.category}</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl title-serif mb-8 group-hover:text-gold transition-colors duration-500">
                  {post.title}
                </h2>
                
                <p className="text-xl text-white/50 font-light leading-relaxed mb-12">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center gap-4 text-white/40 group-hover:text-white transition-colors">
                  <span className="font-mono text-[10px] tracking-[0.3em] uppercase">Read Transmission</span>
                  <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-gold group-hover:border-gold group-hover:text-obsidian transition-all duration-500">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}