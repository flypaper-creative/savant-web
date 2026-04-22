import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, Shield, ShieldCheck, ShieldAlert, Zap, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';

export const BiometricScanner: React.FC = () => {
  const { biometricStatus, setBiometricStatus, addLog } = useStore();
  const [progress, setProgress] = useState(0);
  const [scanLinePos, setScanLinePos] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (biometricStatus === 'SCANNING') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setBiometricStatus('VERIFIED');
            addLog('Biometric verification successful. Root access granted.', 'INFO');
            return 100;
          }
          return prev + 1;
        });
      }, 30);
      return () => clearInterval(interval);
    } else if (biometricStatus === 'AWAITING') {
      setProgress(0);
    }
  }, [biometricStatus, setBiometricStatus, addLog]);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanLinePos((prev) => (prev + 2) % 100);
    }, 20);
    return () => clearInterval(interval);
  }, []);

  const handleStartScan = () => {
    setBiometricStatus('SCANNING');
    addLog('Initializing biometric sequence...', 'INFO');
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 space-y-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      <div className="relative">
        {/* Scanner Ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="w-64 h-64 rounded-full border-2 border-dashed border-emerald-500/30 flex items-center justify-center"
        />
        
        {/* Inner Ring */}
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 rounded-full border border-emerald-500/20"
        />

        {/* Fingerprint Icon Container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <Fingerprint 
              className={`w-24 h-24 transition-colors duration-500 ${
                biometricStatus === 'VERIFIED' ? 'text-emerald-400' : 
                biometricStatus === 'SCANNING' ? 'text-emerald-500 animate-pulse' : 
                'text-emerald-500/40'
              }`} 
            />
            
            {/* Scan Line */}
            {biometricStatus === 'SCANNING' && (
              <motion.div 
                style={{ top: `${scanLinePos}%` }}
                className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-10"
              />
            )}
          </div>
        </div>

        {/* Status Indicators */}
        <AnimatePresence>
          {biometricStatus === 'VERIFIED' && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -top-4 -right-4 bg-emerald-500 text-black p-2 rounded-full shadow-lg shadow-emerald-500/50"
            >
              <ShieldCheck className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <div className="flex justify-between text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest">
          <span>{biometricStatus === 'VERIFIED' ? 'Identity Confirmed' : 'Neural Link Status'}</span>
          <span>{progress}%</span>
        </div>
        
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
          />
        </div>

        <div className="flex justify-center pt-4">
          {biometricStatus === 'AWAITING' && (
            <button 
              onClick={handleStartScan}
              className="group relative px-8 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-emerald-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative font-mono text-sm text-emerald-400 tracking-widest uppercase flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Initiate Neural Scan
              </span>
            </button>
          )}
          
          {biometricStatus === 'SCANNING' && (
            <div className="font-mono text-sm text-emerald-500 animate-pulse tracking-[0.3em] uppercase">
              Analyzing Fractal Shards...
            </div>
          )}

          {biometricStatus === 'VERIFIED' && (
            <div className="flex flex-col items-center space-y-2">
              <div className="font-mono text-sm text-emerald-400 tracking-[0.2em] uppercase flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Root Access Established
              </div>
              <div className="text-[10px] text-emerald-500/40 font-mono">
                Session ID: {Math.random().toString(36).substring(7).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Telemetry Data */}
      <div className="grid grid-cols-2 gap-4 w-full text-[9px] font-mono text-emerald-500/30 border-t border-white/5 pt-6">
        <div className="space-y-1">
          <div className="flex justify-between"><span>LATTICE_SYNC</span><span>99.9%</span></div>
          <div className="flex justify-between"><span>ENTROPY_LEVEL</span><span>0.002</span></div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between"><span>SHARD_INTEGRITY</span><span>OPTIMAL</span></div>
          <div className="flex justify-between"><span>NEURAL_LATENCY</span><span>0.04ms</span></div>
        </div>
      </div>
    </div>
  );
};