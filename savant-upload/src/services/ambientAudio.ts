
class AmbientAudioService {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private humOsc1: OscillatorNode | null = null;
  private humOsc2: OscillatorNode | null = null;
  private pulseOsc: OscillatorNode | null = null;
  private memOsc: OscillatorNode | null = null;
  private noiseNode: AudioWorkletNode | ScriptProcessorNode | AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  private isStarted = false;

  async start() {
    if (this.isStarted) return;

    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 0.05; // Very subtle
    this.masterGain.connect(this.audioCtx.destination);

    this.filter = this.audioCtx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 400;
    this.filter.Q.value = 8;
    this.filter.connect(this.masterGain);

    // Complex Hum (Two detuned oscillators)
    this.humOsc1 = this.audioCtx.createOscillator();
    this.humOsc1.type = 'sawtooth';
    this.humOsc1.frequency.value = 55; // A1
    this.humOsc1.connect(this.filter);
    this.humOsc1.start();

    this.humOsc2 = this.audioCtx.createOscillator();
    this.humOsc2.type = 'sawtooth';
    this.humOsc2.frequency.value = 55.5; // Slightly detuned
    const hum2Gain = this.audioCtx.createGain();
    hum2Gain.gain.value = 0.5;
    this.humOsc2.connect(hum2Gain);
    hum2Gain.connect(this.filter);
    this.humOsc2.start();

    // Pulse Resonance
    this.pulseOsc = this.audioCtx.createOscillator();
    this.pulseOsc.type = 'sine';
    this.pulseOsc.frequency.value = 110; // A2
    const pulseGain = this.audioCtx.createGain();
    pulseGain.gain.value = 0.2;
    this.pulseOsc.connect(pulseGain);
    pulseGain.connect(this.filter);
    this.pulseOsc.start();

    // Memory Resonance (Sub-bass pulse)
    this.memOsc = this.audioCtx.createOscillator();
    this.memOsc.type = 'sine';
    this.memOsc.frequency.value = 27.5; // A0
    const memGain = this.audioCtx.createGain();
    memGain.gain.value = 0.4;
    this.memOsc.connect(memGain);
    memGain.connect(this.filter);
    this.memOsc.start();

    // Data Stream (White Noise)
    const bufferSize = 2 * this.audioCtx.sampleRate;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.audioCtx.createBufferSource();
    (this.noiseNode as AudioBufferSourceNode).buffer = noiseBuffer;
    (this.noiseNode as AudioBufferSourceNode).loop = true;

    this.noiseFilter = this.audioCtx.createBiquadFilter();
    this.noiseFilter.type = 'bandpass';
    this.noiseFilter.frequency.value = 2000;
    this.noiseFilter.Q.value = 1;

    this.noiseGain = this.audioCtx.createGain();
    this.noiseGain.gain.value = 0.05;

    this.noiseNode.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);
    (this.noiseNode as AudioBufferSourceNode).start();

    // LFO for movement
    this.lfo = this.audioCtx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0.5;
    this.lfoGain = this.audioCtx.createGain();
    this.lfoGain.gain.value = 60;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filter.frequency);
    this.lfo.start();

    this.isStarted = true;
  }

  stop() {
    if (!this.isStarted) return;
    this.audioCtx?.close();
    this.isStarted = false;
  }

  updateMetrics(cpuUsage: number, latency: number, memUsage: number) {
    if (!this.isStarted || !this.filter || !this.lfo || !this.humOsc1 || !this.noiseFilter || !this.noiseGain) return;

    const now = this.audioCtx!.currentTime;

    // CPU Usage affects filter cutoff and hum intensity
    const targetFreq = 150 + (cpuUsage / 100) * 1200;
    this.filter.frequency.setTargetAtTime(targetFreq, now, 0.8);

    // Latency affects LFO speed and noise "jitter"
    const lfoFreq = 0.05 + (1 / (latency * 1000 + 0.1)) * 3;
    this.lfo.frequency.setTargetAtTime(lfoFreq, now, 0.5);

    // Data Stream (Noise) reacts to latency - higher latency = more "static"
    const noiseFreq = 1000 + (latency * 500000); // Latency is small, e.g. 0.0014
    this.noiseFilter.frequency.setTargetAtTime(Math.min(noiseFreq, 8000), now, 0.5);
    this.noiseGain.gain.setTargetAtTime(0.02 + (latency * 20), now, 0.5);

    // Memory Usage affects sub-bass pulse and resonance
    const memPitch = 27.5 + (memUsage / 100) * 5;
    this.memOsc?.frequency.setTargetAtTime(memPitch, now, 1.0);
    this.filter.Q.setTargetAtTime(5 + (memUsage / 100) * 15, now, 0.8);

    // Hum pitch shifts slightly with load
    const humPitch = 55 + (cpuUsage / 100) * 3;
    this.humOsc1.frequency.setTargetAtTime(humPitch, now, 0.5);
    this.humOsc2?.frequency.setTargetAtTime(humPitch + 0.5, now, 0.5);
  }

  setVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(volume * 0.1, this.audioCtx!.currentTime, 0.2);
    }
  }
}

export const ambientAudio = new AmbientAudioService();
