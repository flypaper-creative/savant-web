import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { Volume2, VolumeX, Activity, Zap, Cpu, Database } from 'lucide-react';

/**
 * SAVANT_AMBIENT_AUDIO_ENGINE_v1.0
 * 
 * A sovereign, reactive audio synthesis engine that translates system metrics 
 * into a dynamic, generative soundscape.
 * 
 * MAPPINGS:
 * - System Load -> Drone Filter Cutoff & Sub-Bass Depth
 * - Neural Sync -> Pulse Rhythm & Harmonic Complexity
 * - Quantum Entanglement -> High-Frequency Shimmer & Spatial Width
 * - Latency -> Delay Feedback & Granular Jitter
 * - Memory Usage -> Harmonic Hum & Resonance
 */

export const AmbientAudioController: React.FC = () => {
  const { 
    systemLoad, 
    neuralSync, 
    quantumEntanglement, 
    latency, 
    memUsage,
    booted 
  } = useStore();

  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(-12); // dB

  // Audio Engine Refs
  const engineRef = useRef<{
    drone: Tone.Oscillator;
    droneFilter: Tone.Filter;
    pulseSynth: Tone.PolySynth;
    pulseLFO: Tone.LFO;
    shimmer: Tone.Noise;
    shimmerFilter: Tone.Filter;
    delay: Tone.FeedbackDelay;
    reverb: Tone.Reverb;
    masterGain: Tone.Gain;
    isInitialized: boolean;
  } | null>(null);

  const initializeEngine = useCallback(async () => {
    if (engineRef.current?.isInitialized) return;

    await Tone.start();
    console.log('SAVANT_AUDIO_ENGINE: Initialized');

    // 1. MASTER CHAIN
    const masterGain = new Tone.Gain(Tone.dbToGain(volume)).toDestination();
    const limiter = new Tone.Limiter(-3).connect(masterGain);
    const reverb = new Tone.Reverb({ decay: 6, wet: 0.5 }).connect(limiter);
    const delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.6, wet: 0.3 }).connect(reverb);
    const panner = new Tone.AutoPanner('2n').connect(delay).start();

    // 2. DRONE LAYER (System Load)
    const droneFilter = new Tone.Filter({ frequency: 200, type: 'lowpass', Q: 2 }).connect(panner);
    const drone = new Tone.Oscillator({ frequency: 'C1', type: 'sawtooth' }).connect(droneFilter);
    drone.volume.value = -25;

    // 3. PULSE LAYER (Neural Sync)
    const pulseFilter = new Tone.Filter({ frequency: 1200, type: 'bandpass', Q: 4 }).connect(panner);
    const pulseSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3,
      modulationIndex: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.1, release: 2 }
    }).connect(pulseFilter);
    pulseSynth.volume.value = -20;

    const pulseLFO = new Tone.LFO('4n', 200, 3000).connect(pulseFilter.frequency);

    // 4. GRANULAR SHIMMER (Quantum Entanglement)
    const shimmerFilter = new Tone.Filter({ frequency: 10000, type: 'highpass' }).connect(panner);
    const shimmer = new Tone.Noise('pink').connect(shimmerFilter);
    shimmer.volume.value = -45;

    // 5. NEURAL FEEDBACK LOOP
    const feedbackDelay = new Tone.FeedbackDelay({ delayTime: '16n', feedback: 0.8, wet: 0.4 }).connect(panner);
    const feedbackFilter = new Tone.Filter({ frequency: 2000, type: 'lowpass' }).connect(feedbackDelay);
    pulseSynth.connect(feedbackFilter);

    engineRef.current = {
      drone,
      droneFilter,
      pulseSynth,
      pulseLFO,
      shimmer,
      shimmerFilter,
      delay,
      reverb,
      masterGain,
      isInitialized: true
    };

    drone.start();
    shimmer.start();
    pulseLFO.start();

    // Rhythmic Trigger Loop
    const loop = new Tone.Loop((time) => {
      const notes = ['C2', 'G2', 'Eb2', 'Bb2'];
      const note = notes[Math.floor(Math.random() * notes.length)];
      pulseSynth.triggerAttackRelease(note, '16n', time);
    }, '8n').start(0);

    Tone.Transport.start();

    setIsActive(true);
  }, [volume]);

  const toggleAudio = () => {
    if (!isActive) {
      initializeEngine();
    } else {
      setIsMuted(!isMuted);
    }
  };

  // REACTIVE UPDATES
  useEffect(() => {
    if (!engineRef.current || !isActive) return;

    const { droneFilter, pulseLFO, shimmerFilter, delay, masterGain } = engineRef.current;

    // Map System Load to Drone Filter (200Hz to 2000Hz)
    const droneFreq = 200 + (systemLoad * 1800);
    droneFilter.frequency.rampTo(droneFreq, 0.5);

    // Map Neural Sync to Pulse LFO Rate (1Hz to 10Hz)
    const lfoRate = 1 + ((neuralSync - 90) / 10) * 9;
    pulseLFO.frequency.rampTo(lfoRate, 0.5);

    // Map Quantum Entanglement to Shimmer Cutoff (5000Hz to 12000Hz)
    const shimmerFreq = 5000 + ((quantumEntanglement - 99) * 7000);
    shimmerFilter.frequency.rampTo(shimmerFreq, 0.5);

    // Map Latency to Delay Feedback (0.2 to 0.8)
    const feedback = 0.2 + (latency * 300); // latency is around 0.0014
    delay.feedback.rampTo(Math.min(0.8, feedback), 0.5);

    // Handle Mute
    masterGain.gain.rampTo(isMuted ? 0 : Tone.dbToGain(volume), 0.2);

  }, [systemLoad, neuralSync, quantumEntanglement, latency, memUsage, isActive, isMuted, volume]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.drone.stop();
        engineRef.current.shimmer.stop();
        engineRef.current.pulseLFO.stop();
        engineRef.current.masterGain.dispose();
        Tone.Transport.stop();
        Tone.Transport.cancel();
      }
    };
  }, []);

  if (!booted) return null;

  return (
    <div className="fixed bottom-8 left-8 z-[100] flex flex-col gap-4">
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-current/5 backdrop-blur-xl border border-current/10 p-4 rounded-xl flex flex-col gap-3 min-w-[200px] text-current"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-[#FF4068] animate-pulse" />
                <span className="font-mono text-[10px] opacity-60 tracking-widest">audio_core_active</span>
              </div>
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <motion.div 
                    key={i}
                    className="w-1 h-3 bg-[#FF4068]/40"
                    animate={{ 
                      height: [4, 12, 4],
                      backgroundColor: ['rgba(255,64,104,0.2)', 'rgba(255,64,104,0.8)', 'rgba(255,64,104,0.2)']
                    }}
                    transition={{ 
                      duration: 0.5 + Math.random(), 
                      repeat: Infinity,
                      delay: i * 0.1
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Zap className="w-2.5 h-2.5 text-[#E6C03B]" />
                <span className="font-mono text-[8px] opacity-30">sync: {neuralSync.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-2.5 h-2.5 text-[#FF4068]" />
                <span className="font-mono text-[8px] opacity-30">load: {(systemLoad * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-2.5 h-2.5 opacity-40" />
                <span className="font-mono text-[8px] opacity-30">mem: {memUsage.toFixed(0)}%</span>
              </div>
            </div>

            <div className="h-[1px] bg-current/5" />

            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="-40" 
                max="0" 
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 h-1 bg-current/10 rounded-full appearance-none cursor-pointer accent-[#FF4068]"
              />
              <span className="font-mono text-[8px] opacity-40">{volume}dB</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleAudio}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
          ${isActive && !isMuted ? 'bg-[#FF4068] shadow-[0_0_20px_rgba(255,64,104,0.4)] text-white' : 'bg-current/5 border border-current/10 hover:bg-current/10 text-current'}
        `}
      >
        {isMuted || !isActive ? (
          <VolumeX className="w-5 h-5 opacity-60" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </motion.button>
    </div>
  );
};
