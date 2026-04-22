import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { DistortedImage } from '../components/DistortedImage';
import { NeuralUplink } from '../components/NeuralUplink';
import { SavantButton } from '../components/ui/SavantButton';
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

const RevealText = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <div className={`overflow-hidden ${className}`}>
    <motion.div
      initial={{ y: "120%", rotate: 2 }}
      whileInView={{ y: 0, rotate: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, delay, ease: [0.19, 1, 0.22, 1] }}
    >
      {children}
    </motion.div>
  </div>
);

export default function Contact() {
  return (
    <div className="w-full min-h-screen flex flex-col justify-center px-6 md:px-12 relative overflow-hidden text-current">
      <NeuralUplink />
      <div className="absolute inset-0 noise-overlay opacity-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-24 items-center">
        <div className="lg:col-span-7">
          <div className="font-mono text-[10px] text-gold tracking-[0.5em] mb-12 flex items-center gap-6">
            <div className="w-12 h-[1px] bg-gold/30" />
            secure_uplink_channel // v80.0
          </div>
          
          <h1 className="text-[14vw] md:text-[10vw] font-display font-black leading-[0.8] tracking-tighter mb-16 text-white">
            <RevealText>INITIATE</RevealText>
            <div className="flex items-center gap-4">
              <RevealText delay={0.1} className="text-gold italic font-serif font-light text-[0.8em]">Uplink</RevealText>
              <RevealText delay={0.2}>_PROTOCOL</RevealText>
            </div>
          </h1>
          
          <div className="max-w-2xl">
            <SplitText delay={0.2} className="text-xl md:text-2xl opacity-40 font-light leading-relaxed mb-20 text-white">
              Ready to architect your operational reality? Establish a secure connection with our core nodes. We operate strictly on a carte blanche basis for elite clientele.
            </SplitText>
          </div>

          <div className="flex flex-col gap-16">
            <Magnetic strength={0.3}>
              <a href="mailto:transmission@savant.ai" className="group flex items-center gap-8 text-4xl md:text-6xl font-serif font-black hover:italic transition-all duration-700 w-fit text-white">
                transmission@savant.ai
                <ArrowRight className="w-12 h-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-6 transition-all duration-700 text-gold" />
              </a>
            </Magnetic>
            
            <div className="flex gap-16 font-mono text-[10px] tracking-[0.5em] opacity-30 pt-16 border-t border-white/10 uppercase">
              <a href="#" className="hover:text-gold hover:opacity-100 transition-all">twitter</a>
              <a href="#" className="hover:text-gold hover:opacity-100 transition-all">instagram</a>
              <a href="#" className="hover:text-gold hover:opacity-100 transition-all">linkedin</a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1, ease: [0.19, 1, 0.22, 1] }}
            className="p-12 rounded-[4rem] border border-white/5 bg-white/[0.02] backdrop-blur-3xl relative overflow-hidden"
          >
            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

            <div className="font-mono text-[10px] text-gold/60 tracking-[0.5em] mb-12 uppercase relative z-10">transmission_form</div>
            
            <form className="flex flex-col gap-10 relative z-10">
              <div className="flex flex-col gap-4">
                <label className="font-mono text-[8px] text-white/20 uppercase tracking-widest">identity_marker</label>
                <input type="text" placeholder="NAME_OR_ENTITY" className="bg-transparent border-b border-white/10 py-4 font-mono text-sm text-white outline-none focus:border-gold transition-colors" />
              </div>
              <div className="flex flex-col gap-4">
                <label className="font-mono text-[8px] text-white/20 uppercase tracking-widest">uplink_address</label>
                <input type="email" placeholder="EMAIL_PROTOCOL" className="bg-transparent border-b border-white/10 py-4 font-mono text-sm text-white outline-none focus:border-gold transition-colors" />
              </div>
              <div className="flex flex-col gap-4">
                <label className="font-mono text-[8px] text-white/20 uppercase tracking-widest">transmission_payload</label>
                <textarea rows={4} placeholder="OBJECTIVE_DETAILS" className="bg-transparent border-b border-white/10 py-4 font-mono text-sm text-white outline-none focus:border-gold transition-colors resize-none" />
              </div>
              
              <SavantButton className="w-full py-6 mt-6">
                EXECUTE_TRANSMISSION
              </SavantButton>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
