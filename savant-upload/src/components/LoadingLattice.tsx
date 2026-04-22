import { motion } from 'motion/react';

export const LoadingLattice = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="relative w-24 h-24 mb-8">
        {/* Outer Fractal Ring */}
        <motion.div 
          className="absolute inset-0 border border-neon-pink/30"
          style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Middle Fractal Ring */}
        <motion.div 
          className="absolute inset-4 border border-gold/40"
          style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          animate={{ 
            rotate: -360,
            scale: [1, 0.8, 1],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Inner Core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            className="w-2 h-2 bg-white shadow-[0_0_15px_#fff]"
            animate={{ 
              scale: [1, 2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>

        {/* Scanning Line */}
        <motion.div 
          className="absolute inset-0 z-10 pointer-events-none overflow-hidden"
          style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
        >
          <motion.div 
            className="w-full h-[1px] bg-white/50 shadow-[0_0_10px_#fff]"
            animate={{ top: ['-10%', '110%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <div className="font-mono text-[10px] text-neon-pink tracking-[0.6em] font-bold  animate-pulse">
          Syncing_Lattice_Data
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div 
              key={i}
              className="w-1 h-1 bg-white/20"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
