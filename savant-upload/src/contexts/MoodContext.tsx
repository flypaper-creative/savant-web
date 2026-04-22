import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

type Mood = 'inert' | 'alert' | 'forensic' | 'quantum';
type TreeState = 'inert' | 'alert';
type ProjectMode = 'mythic' | 'forensic';

interface MoodContextType {
  mood: Mood;
  energy: number; // 0 to 1
  focus: number; // 0 to 1
  treeState: TreeState;
  projectMode: ProjectMode;
  setMood: (mood: Mood) => void;
  setTreeState: (state: TreeState) => void;
  setProjectMode: (mode: ProjectMode) => void;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export const MoodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mood, setMood] = useState<Mood>('inert');
  const [treeState, setTreeState] = useState<TreeState>('inert');
  const [projectMode, setProjectMode] = useState<ProjectMode>('mythic');
  const [energy, setEnergy] = useState(0.2);
  const [focus, setFocus] = useState(0.5);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const mouseVelocity = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      mouseVelocity.current = dist;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const interval = setInterval(() => {
      // Decay velocity
      mouseVelocity.current *= 0.95;
      
      // Update energy based on velocity
      const targetEnergy = Math.min(1, mouseVelocity.current / 50);
      setEnergy(prev => prev * 0.9 + targetEnergy * 0.1);

      // Focus increases over time if energy is stable
      if (mouseVelocity.current < 5) {
        setFocus(prev => Math.min(1, prev + 0.005));
      } else {
        setFocus(prev => Math.max(0, prev - 0.02));
      }

      // Auto-switch architecture states based on energy/focus
      if (energy > 0.6) setTreeState('alert');
      else if (energy < 0.2) setTreeState('inert');

      if (focus > 0.7) setProjectMode('forensic');
      else if (focus < 0.3) setProjectMode('mythic');

      // Sync mood with architecture states
      if (treeState === 'alert' && projectMode === 'forensic') setMood('quantum');
      else if (treeState === 'alert') setMood('alert');
      else if (projectMode === 'forensic') setMood('forensic');
      else setMood('inert');
    }, 100);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, [energy, focus, treeState, projectMode]);

  return (
    <MoodContext.Provider value={{ 
      mood, energy, focus, treeState, projectMode, 
      setMood, setTreeState, setProjectMode 
    }}>
      {children}
    </MoodContext.Provider>
  );
};

export const useMood = () => {
  const context = useContext(MoodContext);
  if (!context) throw new Error('useMood must be used within a MoodProvider');
  return context;
};
