import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { DistortedImage } from '../components/DistortedImage';

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
      img: "https://picsum.photos/seed/journal1/1200/800"
    },
    {
      id: 2,
      title: "Fractal Identity: Beyond the Surface Layer",
      date: "2026.03.28",
      category: "Methodology",
      excerpt: "Why traditional branding fails in the modern era, and how deep-stack, systemic identity design creates unshakeable market dominance.",
      img: "https://picsum.photos/seed/journal2/1200/800"
    },
    {
      id: 3,
      title: "Sovereign Infrastructure in Web3",
      date: "2026.03.15",
      category: "Engineering",
      excerpt: "A technical deep-dive into building decentralized, impenetrable digital fortresses for high-net-worth operational networks.",
      img: "https://picsum.photos/seed/journal3/1200/800"
    }
  ];

  return (
    <div className="w-full min-h-screen bg-black text-white relative overflow-x-hidden">
      <DistortedImage src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2670&auto=format&fit=crop" className="fixed inset-0 z-0 opacity-10" intensity={0.1} />
      
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
            intel_telemetry // v80.0_kernel
          </motion.div>
          
          <h1 className="text-[18vw] md:text-[14vw] font-serif leading-[0.75] tracking-tighter mb-12">
            <RevealText>the</RevealText>
            <RevealText delay={0.1}><span className="opacity-20 italic">journal.</span></RevealText>
          </h1>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <RevealText delay={0.3}>
              <p className="max-w-xl text-xl md:text-2xl opacity-40 font-light leading-relaxed">
                Deep-stack transmissions on the intersection of sovereign architecture, neural systems, and industrial luxury.
              </p>
            </RevealText>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="flex items-center gap-8"
            >
              <div className="flex flex-col items-end">
                <span className="font-mono text-[10px] text-white/20 uppercase tracking-widest">active_subscribers</span>
                <span className="font-mono text-xl font-black text-gold">12.4K</span>
              </div>
              <div className="w-[1px] h-12 bg-white/10" />
              <div className="flex flex-col items-end">
                <span className="font-mono text-[10px] text-white/20 uppercase tracking-widest">last_sync</span>
                <span className="font-mono text-xl font-black text-neon-pink">04.10.26</span>
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

      {/* --- FEATURED POST --- */}
      <section className="py-40 px-6 md:px-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="font-mono text-[9px] text-white/20 uppercase tracking-[0.5em] mb-20 flex items-center gap-6">
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
            </div>
            featured_transmission
          </div>

          <motion.article 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
            className="group cursor-pointer relative"
          >
            <div className="aspect-[21/9] w-full overflow-hidden rounded-[3rem] border border-white/5 relative">
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/20 transition-all duration-1000 z-10" />
              <img 
                src={posts[0].img} 
                alt={posts[0].title} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex flex-col justify-end p-12 md:p-24 z-20">
                <div className="flex items-center gap-6 mb-8">
                  <span className="font-mono text-xs text-gold font-black tracking-widest">{posts[0].date}</span>
                  <div className="w-12 h-[1px] bg-gold/30" />
                  <span className="font-mono text-[10px] text-white/40 tracking-[0.4em] uppercase">{posts[0].category}</span>
                </div>
                <h2 className="text-5xl md:text-8xl font-serif font-black leading-[0.85] tracking-tighter text-white group-hover:glitch-text transition-all">
                  {posts[0].title}
                </h2>
              </div>
            </div>
          </motion.article>
        </div>
      </section>

      {/* --- POSTS GRID --- */}
      <section className="py-40 px-6 md:px-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24 md:gap-32">
            {posts.slice(1).map((post, i) => (
              <motion.article 
                key={post.id}
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.2, delay: i * 0.2, ease: [0.19, 1, 0.22, 1] }}
                className="group cursor-pointer"
              >
                <div className="aspect-[4/5] w-full overflow-hidden rounded-[2.5rem] border border-white/5 mb-12 relative">
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-all duration-1000 z-10" />
                  <img 
                    src={post.img} 
                    alt={post.title} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute top-10 left-10 z-20 font-mono text-[8px] tracking-[0.5em] text-white/40 uppercase">
                    transmission_0{post.id}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 mb-8">
                  <span className="font-mono text-xs text-gold/60 tracking-widest uppercase">{post.date}</span>
                  <div className="w-8 h-[1px] bg-white/10" />
                  <span className="font-mono text-[10px] opacity-30 tracking-[0.4em] uppercase">{post.category}</span>
                </div>
                
                <h3 className="text-4xl md:text-5xl font-serif font-black leading-tight tracking-tighter mb-8 text-white group-hover:italic transition-all duration-1000">
                  {post.title}
                </h3>
                
                <p className="text-xl opacity-40 font-light leading-relaxed mb-12 text-white line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center gap-6 opacity-20 group-hover:opacity-100 transition-all duration-700">
                  <span className="font-mono text-[10px] tracking-[0.5em] uppercase">read_full_intel</span>
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-gold group-hover:border-gold group-hover:text-black transition-all duration-700">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* --- NEWSLETTER --- */}
      <section className="py-60 px-6 md:px-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-12 md:p-24 rounded-[4rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl relative overflow-hidden"
          >
            <div className="absolute inset-0 noise-overlay opacity-10" />
            <h2 className="text-5xl md:text-7xl font-serif font-black tracking-tighter mb-12 text-white">
              Join the <span className="italic opacity-30">sovereign</span> network.
            </h2>
            <p className="text-xl opacity-40 font-light leading-relaxed mb-16 max-w-2xl mx-auto">
              Receive deep-stack transmissions and kernel updates directly to your neural interface.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto">
              <input 
                type="email" 
                placeholder="NEURAL_IDENTIFIER@DOMAIN.COM"
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-8 py-5 font-mono text-xs tracking-widest outline-none focus:border-gold/50 transition-all"
              />
              <button className="bg-gold text-black font-mono text-xs font-black tracking-[0.3em] px-10 py-5 rounded-2xl hover:bg-white transition-all uppercase">
                subscribe
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
