import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, useMotionValue, useSpring } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Magnetic } from './Magnetic';
import { NavWebGLImages } from './NavWebGLImages';

const items = [
  { path: '/', label: 'home', sub: 'core_index', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' },
  { path: '/work', label: 'archive', sub: 'past_projects', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop' },
  { path: '/services', label: 'methodology', sub: 'our_process', img: 'https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=2574&auto=format&fit=crop' },
  { path: '/journal', label: 'journal', sub: 'transmissions', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2670&auto=format&fit=crop' },
  { path: '/contact', label: 'uplink', sub: 'initiate_contact', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop' },
];

const Curve = () => {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (windowSize.width === 0) return null;

  const initialPath = `M0 0 L${windowSize.width} 0 L${windowSize.width} 0 Q${windowSize.width / 2} 0 0 0 Z`;
  const targetPath = `M0 0 L${windowSize.width} 0 L${windowSize.width} ${windowSize.height} Q${windowSize.width / 2} ${windowSize.height} 0 ${windowSize.height} Z`;
  const exitPath = `M0 0 L${windowSize.width} 0 L${windowSize.width} 0 Q${windowSize.width / 2} 0 0 0 Z`;

  const curve: any = {
    initial: {
      d: initialPath,
    },
    enter: {
      d: targetPath,
      transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] },
    },
    exit: {
      d: exitPath,
      transition: { duration: 1, ease: [0.76, 0, 0.24, 1] },
    },
  };

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-[-1]">
      <svg className="w-full h-full">
        <motion.path
          variants={curve}
          initial="initial"
          animate="enter"
          exit="exit"
          fill="#0a0a0a"
        />
      </svg>
      {/* Secondary Layer for Depth */}
      <svg className="absolute inset-0 w-full h-full opacity-50">
        <motion.path
          variants={{
            initial: { d: initialPath },
            enter: { d: targetPath, transition: { duration: 1.4, ease: [0.76, 0, 0.24, 1], delay: 0.05 } },
            exit: { d: exitPath, transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] } }
          }}
          initial="initial"
          animate="enter"
          exit="exit"
          fill="#1a1a1a"
        />
      </svg>
    </div>
  );
};

const KineticText = ({ text, isHovered, isActive }: { text: string, isHovered: boolean, isActive: boolean }) => {
  return (
    <div className="flex overflow-hidden relative perspective-1000">
      {text.split('').map((char, i) => (
        <motion.span
          key={`char-1-${i}`}
          initial={{ y: 0, rotateX: 0, opacity: 1 }}
          animate={{ 
            y: isHovered ? '-120%' : 0,
            rotateX: isHovered ? 90 : 0,
            opacity: isHovered ? 0 : 1,
            color: isActive ? '#E6C03B' : '#FFFFFF',
            fontStyle: isHovered || isActive ? 'italic' : 'normal',
            filter: isHovered ? 'blur(10px)' : 'blur(0px)'
          }}
          transition={{ duration: 0.8, delay: i * 0.03, ease: [0.19, 1, 0.22, 1] }}
          className="inline-block origin-bottom"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
      <div className="absolute inset-0 flex">
        {text.split('').map((char, i) => (
          <motion.span
            key={`char-2-${i}`}
            initial={{ y: '120%', rotateX: -90, opacity: 0 }}
            animate={{ 
              y: isHovered ? 0 : '120%',
              rotateX: isHovered ? 0 : -90,
              opacity: isHovered ? 1 : 0,
              color: '#E6C03B',
              fontStyle: 'italic',
              filter: isHovered ? 'blur(0px)' : 'blur(10px)'
            }}
            transition={{ duration: 0.8, delay: i * 0.03, ease: [0.19, 1, 0.22, 1] }}
            className="inline-block origin-top"
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </div>
      
      {/* Glitch Layer on Hover */}
      {isHovered && (
        <div className="absolute inset-0 flex pointer-events-none mix-blend-screen">
          {text.split('').map((char, i) => (
            <motion.span
              key={`char-glitch-${i}`}
              initial={{ opacity: 0, x: 0 }}
              animate={{ 
                opacity: [0, 0.5, 0],
                x: [0, (Math.random() - 0.5) * 20, 0],
              }}
              transition={{ 
                duration: 0.2, 
                repeat: Infinity, 
                repeatType: 'reverse',
                delay: i * 0.01 
              }}
              className="inline-block text-gold/30 italic"
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Mouse parallax for images
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 40; // max 20px movement
      const y = (e.clientY / innerHeight - 0.5) * 40;
      mouseX.set(x);
      mouseY.set(y);
    };

    if (isOpen) {
      window.addEventListener('mousemove', handleMouseMove);
    } else {
      mouseX.set(0);
      mouseY.set(0);
    }

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isOpen, mouseX, mouseY]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    setTimeout(() => navigate(path), 800); // Wait for exit animation
  };

  return (
    <div className="pointer-events-auto">
      {/* Burger Button */}
      <Magnetic strength={0.2}>
        <button 
          onClick={toggleMenu}
          className="relative z-[10000] w-16 h-16 flex flex-col items-center justify-center gap-2 focus:outline-none group mix-blend-difference rounded-full hover:bg-white/5 transition-colors"
        >
          <motion.div 
            animate={{ 
              rotate: isOpen ? 45 : 0, 
              y: isOpen ? 9 : 0,
            }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            className="h-[1px] w-8 bg-white opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <motion.div 
            animate={{ 
              opacity: isOpen ? 0 : 1,
              x: isOpen ? 20 : 0
            }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            className="h-[1px] w-8 bg-white opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <motion.div 
            animate={{ 
              rotate: isOpen ? -45 : 0, 
              y: isOpen ? -9 : 0,
            }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            className="h-[1px] w-8 bg-white opacity-80 group-hover:opacity-100 transition-opacity"
          />
        </button>
      </Magnetic>

      {/* Fullscreen Menu */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[9999] flex flex-col justify-center px-6 md:px-24 text-white overflow-hidden"
          >
            <Curve />
            
            <div className="absolute inset-0 noise-overlay opacity-20 pointer-events-none" />
            
            {/* Hover Images */}
            <NavWebGLImages items={items} activeIndex={hoveredItem} mouseX={mouseXSpring} mouseY={mouseYSpring} />

            <div className="absolute top-12 left-12 font-mono text-xs opacity-50 tracking-[1em] z-10">
              savant_os // navigation
            </div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center w-full max-w-7xl mx-auto h-full pt-32 pb-24">
              
              <nav className="flex flex-col gap-2 md:gap-6 w-full md:w-2/3">
                {items.map((item, index) => (
                  <div 
                    key={item.path}
                    className="overflow-hidden"
                    onMouseEnter={() => setHoveredItem(index)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <motion.button
                      initial={{ y: '100%', rotate: 5 }}
                      animate={{ y: 0, rotate: 0 }}
                      exit={{ y: '-100%', rotate: -5 }}
                      transition={{ delay: 0.1 + index * 0.05, duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                      onClick={() => handleNavigate(item.path)}
                      className="group flex items-center gap-8 focus:outline-none w-fit text-left"
                    >
                      <span className="font-mono text-sm opacity-20 group-hover:opacity-100 group-hover:text-gold transition-all duration-500 hidden md:block">
                        0{index + 1}
                      </span>
                      <div className="relative">
                        <h2 className="text-5xl sm:text-7xl md:text-8xl title-serif tracking-tighter">
                          <KineticText text={item.label} isHovered={hoveredItem === index} isActive={location.pathname === item.path} />
                        </h2>
                        <div className="absolute top-1/2 -right-32 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-4 transition-all duration-700 hidden lg:block font-mono text-xs text-gold tracking-widest">
                          // {item.sub}
                        </div>
                      </div>
                    </motion.button>
                  </div>
                ))}
              </nav>

              <div className="hidden md:flex flex-col gap-12 w-1/3 pl-12 border-l border-white/10 h-full justify-center">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                  className="savant-stack !gap-4"
                >
                  <h4 className="font-mono text-[10px] tracking-[0.5em] text-white/40">headquarters</h4>
                  <p className="font-sans text-sm text-white/80 leading-relaxed">
                    1200 neural avenue<br/>
                    sector 4, neo-tokyo<br/>
                    earth, sol system
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: 0.6, duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                  className="savant-stack !gap-4"
                >
                  <h4 className="font-mono text-[10px] tracking-[0.5em] text-white/40">direct_uplink</h4>
                  <a href="mailto:uplink@savant.os" className="font-sans text-sm text-white/80 hover:text-gold transition-colors">uplink@savant.os</a>
                  <a href="tel:+1800SAVANT" className="font-sans text-sm text-white/80 hover:text-gold transition-colors">+1 [800] savant</a>
                </motion.div>
              </div>

            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute bottom-12 left-12 right-12 flex justify-between items-end font-mono text-[10px] tracking-[0.5em] opacity-40 border-t border-white/10 pt-8 z-10"
            >
              <div className="flex flex-col gap-2">
                <span>system_status: nominal</span>
                <span>encryption: active</span>
              </div>
              <div className="flex gap-12">
                <Magnetic strength={0.2}><a href="#" className="hover:text-gold transition-colors">twitter</a></Magnetic>
                <Magnetic strength={0.2}><a href="#" className="hover:text-gold transition-colors">linkedin</a></Magnetic>
                <Magnetic strength={0.2}><a href="#" className="hover:text-gold transition-colors">instagram</a></Magnetic>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
