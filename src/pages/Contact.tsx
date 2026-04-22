import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

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

export default function Contact() {
  return (
    <div className="w-full bg-obsidian text-white min-h-screen flex flex-col justify-center px-6 md:px-12 relative overflow-hidden">
      <div className="absolute inset-0 neural-lattice-overlay opacity-20" />
      
      <div className="max-w-7xl mx-auto w-full relative z-10 savant-grid">
        <div className="md:col-span-7">
          <div className="font-mono text-[10px] md:text-xs text-gold tracking-[0.5em] md:tracking-[1em] uppercase font-bold mb-8">
            <RevealText>Secure Channel</RevealText>
          </div>
          
          <h1 className="text-huge title-serif leading-[0.8] tracking-tighter uppercase mb-12">
            <RevealText>INITIATE</RevealText>
            <RevealText delay={0.1}><span className="text-gold italic">UPLINK.</span></RevealText>
          </h1>
          
          <div className="max-w-xl">
            <RevealText delay={0.2}>
              <p className="text-xl text-white/60 font-light leading-relaxed mb-16">
                Ready to architect your operational reality? Establish a secure connection with our core nodes. We operate strictly on a carte blanche basis for elite clientele.
              </p>
            </RevealText>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="flex flex-col gap-8"
          >
            <a href="mailto:transmission@savant.ai" className="group flex items-center gap-6 text-3xl md:text-5xl title-serif hover:text-gold transition-colors w-fit">
              transmission@savant.ai
              <ArrowRight className="w-8 h-8 opacity-0 group-hover:opacity-100 group-hover:translate-x-4 transition-all duration-500" />
            </a>
            
            <div className="flex gap-12 font-mono text-xs tracking-widest uppercase text-white/40 pt-12 border-t border-white/10">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
            </div>
          </motion.div>
        </div>

        <div className="md:col-span-4 md:col-start-9 hidden md:flex flex-col justify-end pb-12">
          <div className="glass-panel p-8 rounded-3xl">
            <div className="font-mono text-[10px] text-gold tracking-[0.5em] uppercase mb-6">System Status</div>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="font-mono text-xs text-white/40 uppercase">Availability</span>
                <span className="font-mono text-xs text-emerald-400 uppercase">Accepting Transmissions</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="font-mono text-xs text-white/40 uppercase">Encryption</span>
                <span className="font-mono text-xs text-white uppercase">AES-256 Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-white/40 uppercase">Response Time</span>
                <span className="font-mono text-xs text-white uppercase">&lt; 24 Hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}