import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Github, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Magnetic } from './Magnetic';

export const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-white/5 py-32 px-6 md:px-12 overflow-hidden bg-black">
      <div className="absolute inset-0 noise-overlay opacity-20 pointer-events-none" />
      
      {/* Massive Marquee */}
      <div className="absolute top-0 left-0 w-full overflow-hidden opacity-[0.02] pointer-events-none select-none">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="text-[25vw] font-display font-black whitespace-nowrap tracking-tighter leading-none"
        >
          SAVANT CORE SAVANT CORE SAVANT CORE SAVANT CORE
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 mb-32">
          <div className="md:col-span-6">
            <h3 className="text-5xl md:text-7xl font-serif tracking-tighter mb-12 text-white">
              let's engineer <br />
              <span className="opacity-30 italic">the future.</span>
            </h3>
            <div className="flex flex-wrap gap-8">
              <Magnetic strength={0.2}>
                <Link to="/contact" className="group relative inline-flex items-center gap-4 px-10 py-5 bg-gold text-black font-mono text-xs tracking-widest uppercase transition-all duration-500 hover:scale-105">
                  initiate protocol
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Link>
              </Magnetic>
              <Magnetic strength={0.2}>
                <a href="mailto:uplink@savant.os" className="inline-flex items-center gap-4 px-10 py-5 border border-white/10 text-white font-mono text-xs tracking-widest uppercase hover:bg-white/5 transition-all">
                  direct_uplink
                </a>
              </Magnetic>
            </div>
          </div>

          <div className="md:col-span-2 md:col-start-8">
            <h4 className="font-mono text-[10px] tracking-[0.5em] mb-10 opacity-30 uppercase">navigation</h4>
            <ul className="space-y-6">
              {['home', 'work', 'services', 'journal', 'contact'].map((item) => (
                <li key={item}>
                  <Link to={item === 'home' ? '/' : `/${item}`} className="group flex items-center gap-4 font-sans text-lg text-white/60 hover:text-white transition-colors">
                    <span className="w-0 group-hover:w-4 h-[1px] bg-gold transition-all duration-500" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 md:col-start-11">
            <h4 className="font-mono text-[10px] tracking-[0.5em] mb-10 opacity-30 uppercase">socials</h4>
            <ul className="space-y-6">
              {[
                { label: 'twitter', icon: Twitter },
                { label: 'instagram', icon: Instagram },
                { label: 'linkedin', icon: Linkedin },
                { label: 'github', icon: Github },
              ].map((item) => (
                <li key={item.label}>
                  <a href="#" className="group flex items-center gap-4 font-sans text-lg text-white/60 hover:text-white transition-colors">
                    <item.icon className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between font-mono text-[10px] opacity-30 tracking-[0.5em] uppercase">
          <div className="flex flex-col md:flex-row gap-8 md:gap-16">
            <p>© 2026 savant core // all rights reserved</p>
            <p>system_status: nominal</p>
          </div>
          <div className="mt-8 md:mt-0 flex gap-12">
            <a href="#" className="hover:text-white transition-colors">privacy_policy</a>
            <a href="#" className="hover:text-white transition-colors">terms_of_service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
