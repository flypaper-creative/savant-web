import { Howl } from 'howler';

class UISoundManager {
  private sounds: Map<string, Howl> = new Map();
  private initialized: boolean = false;

  private init() {
    if (this.initialized) return;
    
    // Define sounds with variations for a more "organic" tech feel
    this.sounds.set('hover', new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'], // Placeholder for high-quality UI beep
      volume: 0.1,
      rate: 1.5
    }));

    this.sounds.set('click', new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'], // Placeholder for premium click
      volume: 0.3,
      rate: 1.2
    }));

    this.sounds.set('transition', new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'],
      volume: 0.2
    }));

    this.initialized = true;
  }

  public playHover() {
    this.init();
    // Add slight pitch randomization for quality
    const sound = this.sounds.get('hover');
    if (sound) {
      sound.rate(1.4 + Math.random() * 0.2);
      sound.play();
    }
  }

  public playClick() {
    this.init();
    const sound = this.sounds.get('click');
    if (sound) {
      sound.rate(1.1 + Math.random() * 0.2);
      sound.play();
    }
  }

  public playTransition() {
    this.init();
    this.sounds.get('transition')?.play();
  }
}

export const uiSound = new UISoundManager();
