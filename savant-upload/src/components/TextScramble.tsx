import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

const CHARS = '!<>-_\\/[]{}—=+*^?#________';

export function TextScramble({ text, className, trigger = true }: { text: string, className?: string, trigger?: boolean }) {
  const [displayText, setDisplayText] = useState(text);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!trigger || !inView) return;

    let iteration = 0;
    let interval: number;

    const scramble = () => {
      setDisplayText(
        text
          .split('')
          .map((letter, index) => {
            if (index < iteration) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3;
    };

    interval = window.setInterval(scramble, 30);

    return () => clearInterval(interval);
  }, [text, trigger, inView]);

  return (
    <motion.span 
      className={className}
      onViewportEnter={() => setInView(true)}
      viewport={{ once: true }}
    >
      {displayText}
    </motion.span>
  );
}
