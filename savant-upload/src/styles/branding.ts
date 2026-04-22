/**
 * Universal Branding Template - Design Tokens
 * Solidifying a dynamic and modular branding system for Sovereign OS and future apps.
 */

export const BRANDING = {
  colors: {
    gunmetal: {
      base: '#3d444d',
      dark: '#2c3138',
      light: '#4e5661',
    },
    gold: {
      base: '#e6c03b',
      dark: '#c4a332',
      light: '#f2d15a',
    },
    neonPink: {
      base: '#ff4068',
      glow: 'rgba(255, 64, 104, 0.5)',
      muted: 'rgba(255, 64, 104, 0.1)',
    },
    background: {
      obsidian: '#0a0a0a',
      industrial: '#151515',
      surface: 'rgba(20, 20, 20, 0.8)',
      glass: 'rgba(255, 255, 255, 0.03)',
    },
    text: {
      white: '#ffffff',
      dim: 'rgba(255, 255, 255, 0.6)',
      ghost: 'rgba(255, 255, 255, 0.2)',
      pink: '#ff4068',
      gold: '#e6c03b',
    }
  },
  typography: {
    sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
    display: '"Inter", ui-sans-serif, system-ui, sans-serif',
    serif: '"Playfair Display", serif',
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      bold: 700,
      black: 900,
    }
  },
  animation: {
    timing: {
      instant: 0.1,
      fast: 0.2,
      normal: 0.4,
      slow: 0.8,
      glacial: 2.0,
      pulse: 4.0,
    },
    easing: {
      smooth: [0.16, 1, 0.3, 1],
      bounce: [0.68, -0.6, 0.32, 1.6],
      linear: [0, 0, 1, 1],
    }
  },
  borders: {
    thin: '1px solid rgba(255, 255, 255, 0.05)',
    medium: '1px solid rgba(255, 255, 255, 0.1)',
    glow: '1px solid rgba(255, 64, 104, 0.3)',
    radius: {
      none: '0px',
      sm: '2px',
      md: '4px',
      lg: '8px',
      xl: '16px',
      full: '9999px',
    }
  },
  effects: {
    blur: {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
      xxl: 'backdrop-blur-3xl',
    },
    shadow: {
      sm: '0 2px 8px rgba(0, 0, 0, 0.2)',
      md: '0 8px 32px rgba(0, 0, 0, 0.4)',
      lg: '0 16px 64px rgba(0, 0, 0, 0.6)',
      glow: '0 0 20px rgba(255, 64, 104, 0.2)',
    }
  }
};

export type Branding = typeof BRANDING;
