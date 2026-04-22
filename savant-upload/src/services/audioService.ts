import * as Tone from 'tone';

type Mood = 'inert' | 'alert' | 'forensic' | 'quantum';

class AudioService {
  private static instance: AudioService;
  private isInitialized = false;
  private synth: Tone.PolySynth;
  private drone: Tone.Oscillator;
  private neuralLayer: Tone.Noise;
  private quantumLayer: Tone.Oscillator;
  private bioSyncLayer: Tone.Oscillator;
  private filter: Tone.Filter;
  private delay: Tone.FeedbackDelay;
  private reverb: Tone.Reverb;
  private lfo: Tone.LFO;
  private mainGain: Tone.Gain;
  private currentMood: Mood = 'inert';

  private constructor() {
    this.mainGain = new Tone.Gain(1).toDestination();
    this.filter = new Tone.Filter(800, 'lowpass').connect(this.mainGain);
    this.reverb = new Tone.Reverb(10).connect(this.filter);
    this.delay = new Tone.FeedbackDelay('8n', 0.6).connect(this.reverb);
    
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 4, decay: 2, sustain: 0.8, release: 10 }
    }).connect(this.delay);

    this.drone = new Tone.Oscillator(432, 'sine').connect(this.reverb);
    this.neuralLayer = new Tone.Noise('brown').connect(this.filter);
    this.bioSyncLayer = new Tone.Oscillator(0.5, 'sine');
    this.quantumLayer = new Tone.Oscillator(0.1, 'sine').connect(this.reverb);
    
    this.lfo = new Tone.LFO(0.05, 300, 1500).connect(this.filter.frequency);
    
    // Use gain nodes for volume instead of .volume.value to avoid RangeErrors
    this.synth.volume.value = -25;
    this.drone.volume.value = -35;
    this.neuralLayer.volume.value = -45;
    this.quantumLayer.volume.value = -50;
  }

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  public async initialize() {
    if (this.isInitialized) return;
    try {
      await Tone.start();
      await this.reverb.ready;
      this.isInitialized = true;
      this.drone.start();
      this.neuralLayer.start();
      this.bioSyncLayer.start();
      this.quantumLayer.start();
      this.lfo.start();
      this.startGenerativeLoop();
    } catch (error) {
      console.error("Failed to initialize AudioService:", error);
    }
  }

  private startGenerativeLoop() {
    const notes = ['A1', 'E2', 'A2', 'C3', 'E3', 'G3', 'B3', 'D4', 'F4'];
    
    const loop = new Tone.Loop((time) => {
      const probability = this.currentMood === 'alert' ? 0.6 : 0.3;
      if (Math.random() < probability) {
        const note = notes[Math.floor(Math.random() * notes.length)];
        const duration = this.currentMood === 'alert' ? '8n' : '4n';
        this.synth.triggerAttackRelease(note, duration, time);
      }
    }, '2n').start(0);

    Tone.Transport.start();
  }

  public updateMood(mood: Mood, energy: number, focus: number) {
    if (!this.isInitialized) return;
    this.currentMood = mood;
    
    const safeEnergy = Math.max(0.001, Math.min(1, energy));
    const safeFocus = Math.max(0.001, Math.min(1, focus));

    switch (mood) {
      case 'inert':
        this.filter.frequency.rampTo(300, 4);
        this.lfo.frequency.rampTo(0.02, 4);
        this.synth.volume.rampTo(-30, 4);
        this.drone.frequency.rampTo(54, 10); 
        this.quantumLayer.volume.rampTo(-60, 5);
        break;
      case 'alert':
        this.filter.frequency.rampTo(2500, 1);
        this.lfo.frequency.rampTo(1.5, 1);
        this.synth.volume.rampTo(-18, 1);
        this.drone.frequency.rampTo(108, 2);
        this.quantumLayer.volume.rampTo(-40, 2);
        break;
      case 'forensic':
        this.filter.frequency.rampTo(1000, 3);
        this.lfo.frequency.rampTo(0.2, 3);
        this.synth.volume.rampTo(-22, 3);
        this.drone.frequency.rampTo(81, 5);
        this.quantumLayer.volume.rampTo(-45, 3);
        break;
      case 'quantum':
        this.filter.frequency.rampTo(4000, 5);
        this.lfo.frequency.rampTo(8, 5);
        this.synth.volume.rampTo(-20, 5);
        this.drone.frequency.rampTo(162, 8);
        this.quantumLayer.volume.rampTo(-35, 2);
        break;
    }

    this.neuralLayer.volume.rampTo(-50 + safeEnergy * 15, 2);
    this.reverb.wet.rampTo(0.2 + safeFocus * 0.6, 2);
    this.delay.feedback.rampTo(0.3 + safeEnergy * 0.5, 2);
    this.bioSyncLayer.frequency.rampTo(0.1 + safeEnergy * 2, 2);
    this.quantumLayer.frequency.rampTo(200 + safeEnergy * 1000, 1);
  }

  public stop() {
    Tone.Transport.stop();
    this.drone.stop();
    this.neuralLayer.stop();
    this.bioSyncLayer.stop();
    this.lfo.stop();
  }
}

export const audioService = AudioService.getInstance();
