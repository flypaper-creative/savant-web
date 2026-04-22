import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export function ParallaxImage({ src, alt, className, offset = 100 }: { src: string, alt: string, className?: string, offset?: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);

  return (
    <div ref={ref} className={`overflow-hidden relative ${className}`}>
      <motion.div
        initial={{ height: "100%" }}
        whileInView={{ height: "0%" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true }}
        className="absolute inset-0 bg-obsidian z-10 origin-top"
      />
      <motion.img 
        src={src} 
        alt={alt}
        style={{ y, scale: 1.2 }} 
        className="absolute inset-0 w-full h-full object-cover origin-center"
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  );
}
