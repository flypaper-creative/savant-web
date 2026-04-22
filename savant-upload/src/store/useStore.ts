import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
}

interface OSState {
  booted: boolean;
  clearance: 'USER' | 'ADMIN' | 'ROOT';
  activeNodes: number;
  latency: number;
  cpuUsage: number;
  memUsage: number;
  systemLoad: number;
  quantumEntanglement: number;
  shardIntegrity: number;
  neuralSync: number;
  biometricStatus: 'AWAITING' | 'SCANNING' | 'VERIFIED' | 'DENIED';
  logs: SystemLog[];
  chromaticAberration: boolean;
  scanlines: boolean;
  neuralOverlay: boolean;
  template: number;
  setBooted: (booted: boolean) => void;
  addLog: (message: string, level?: SystemLog['level']) => void;
  updateMetrics: () => void;
  toggleEffect: (effect: 'chromaticAberration' | 'scanlines' | 'neuralOverlay') => void;
  setClearance: (level: 'USER' | 'ADMIN' | 'ROOT') => void;
  setBiometricStatus: (status: OSState['biometricStatus']) => void;
  setTemplate: (template: number) => void;
}

export const useStore = create<OSState>()(
  persist(
    (set) => ({
      booted: false,
      clearance: 'USER',
      activeNodes: 5421,
      latency: 0.0014,
      cpuUsage: 42,
      memUsage: 68,
      systemLoad: 0.42,
      quantumEntanglement: 99.998,
      shardIntegrity: 0.999,
      neuralSync: 0.984,
      biometricStatus: 'AWAITING',
      logs: [],
      chromaticAberration: false,
      scanlines: true,
      neuralOverlay: false,
      template: 1,
      setBooted: (booted) => set({ booted }),
      addLog: (message, level = 'INFO') => set((state) => ({
        logs: [
          {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString(),
            level,
            message
          },
          ...state.logs
        ].slice(0, 50)
      })),
      updateMetrics: () => set((state) => {
        const newCpu = Math.max(10, Math.min(95, state.cpuUsage + (Math.random() - 0.5) * 10));
        return {
          activeNodes: state.activeNodes + (Math.random() > 0.5 ? 1 : -1),
          latency: 0.0010 + Math.random() * 0.0010,
          cpuUsage: newCpu,
          memUsage: Math.max(20, Math.min(90, state.memUsage + (Math.random() - 0.5) * 5)),
          systemLoad: newCpu / 100,
          quantumEntanglement: 99.99 + (Math.random() * 0.01),
          shardIntegrity: 0.999 + (Math.random() * 0.001),
          neuralSync: 0.98 + (Math.random() * 0.02)
        };
      }),
      toggleEffect: (effect) => set((state) => ({ [effect]: !state[effect] })),
      setClearance: (level) => set({ clearance: level }),
      setBiometricStatus: (status) => set({ biometricStatus: status }),
      setTemplate: (template) => set({ template })
    }),
    {
      name: 'savant-os-storage',
      partialize: (state) => ({ 
        booted: state.booted, 
        clearance: state.clearance,
        chromaticAberration: state.chromaticAberration,
        scanlines: state.scanlines,
        neuralOverlay: state.neuralOverlay,
        template: state.template
      }),
    }
  )
);
