import React, { useEffect, useState } from 'react';
import { useMood } from '../contexts/MoodContext';
import { audioService } from '../services/audioService';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';

export const AmbientMusic: React.FC = () => {
  const { mood, energy, focus, treeState, projectMode } = useMood();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      audioService.updateMood(mood, energy, focus);
    }
  }, [mood, energy, focus, isPlaying]);

  const handleToggle = async () => {
    if (!isPlaying) {
      await audioService.initialize();
      setIsPlaying(true);
      setHasInteracted(true);
    } else {
      audioService.stop();
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {!hasInteracted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl max-w-[200px] text-right"
          >
            <p className="font-mono text-[10px] text-white/60  tracking-widest leading-relaxed">
              Initialize cognitive audio stream for full immersion.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-700 ${
          isPlaying 
            ? 'bg-neon-pink border-neon-pink text-white shadow-[0_0_20px_rgba(255,64,104,0.4)]' 
            : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
        }`}
      >
        {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </motion.button>
      
      {isPlaying && (
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1 h-4 items-end px-2">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  height: [4, 12, 6, 16, 4],
                }}
                transition={{
                  duration: 1 + i * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-[2px] bg-neon-pink/60"
              />
            ))}
          </div>
          
          <div className="flex flex-col gap-1 w-32">
            <div className="flex justify-between text-[8px] font-mono text-white/40 uppercase tracking-tighter">
              <span>Energy</span>
              <span>{Math.round(energy * 100)}%</span>
            </div>
            <div className="h-[1px] w-full bg-white/10 overflow-hidden">
              <motion.div 
                className="h-full bg-neon-pink" 
                animate={{ width: `${energy * 100}%` }}
              />
            </div>
            
            <div className="flex justify-between text-[8px] font-mono text-white/40 uppercase tracking-tighter mt-1">
              <span>Focus</span>
              <span>{Math.round(focus * 100)}%</span>
            </div>
            <div className="h-[1px] w-full bg-white/10 overflow-hidden">
              <motion.div 
                className="h-full bg-gold" 
                animate={{ width: `${focus * 100}%` }}
              />
            </div>
            
            <div className="flex flex-col gap-0.5 mt-2 border-t border-white/5 pt-2">
              <div className="flex justify-between text-[7px] font-mono uppercase tracking-widest">
                <span className="text-white/30">Tree:</span>
                <span className={treeState === 'alert' ? 'text-neon-pink' : 'text-white/60'}>{treeState}</span>
              </div>
              <div className="flex justify-between text-[7px] font-mono uppercase tracking-widest">
                <span className="text-white/30">Mode:</span>
                <span className={projectMode === 'forensic' ? 'text-gold' : 'text-white/60'}>{projectMode}</span>
              </div>
              <div className="flex justify-between text-[7px] font-mono uppercase tracking-widest mt-1">
                <span className="text-white/30">Mood:</span>
                <span className="text-white">{mood}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
