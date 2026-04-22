import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export function ZoomBlock({ children, className }: { children: React.ReactNode, className?: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"]
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ opacity }} className="w-full h-full">
        {children}
      </motion.div>
    </div>
  );
}
