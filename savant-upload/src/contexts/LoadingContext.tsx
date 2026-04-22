import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export type LoadingPhase = 'booting' | 'ready' | 'transition' | 'complete';

interface LoadingContextType {
  isLoading: boolean;
  progress: number;
  phase: LoadingPhase;
  setLoading: (loading: boolean) => void;
  setProgress: (progress: number) => void;
  finishLoading: () => void;
  enterSite: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<LoadingPhase>('booting');
  const startTime = useRef(Date.now());
  const hasFinished = useRef(false);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  // Simulate asset loading that takes at least 4 seconds
  // The logo animation will play *while* this is happening
  useEffect(() => {
    if (hasFinished.current) return;

    const duration = 2000; // Minimum 2 seconds of loading
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(Math.floor((currentStep / steps) * 100), 99);
      setProgress(newProgress);

      if (currentStep >= steps) {
        clearInterval(timer);
        finishLoading();
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const finishLoading = useCallback(() => {
    if (hasFinished.current) return;
    hasFinished.current = true;
    
    setProgress(100);
    
    // When loading hits 100%, we wait for user interaction
    setPhase('ready');
  }, []);

  const enterSite = useCallback(() => {
    console.log('Entering site from phase:', phase);
    if (phase !== 'ready') return;
    
    // Transition takes 1.5 seconds
    setPhase('transition');
    
    setTimeout(() => {
      console.log('Transition complete');
      setPhase('complete');
      setIsLoading(false);
    }, 1500);
  }, [phase]);

  // Safety timeout to prevent stuck preloader
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && !hasFinished.current) {
        console.warn('Loading safety timeout triggered');
        finishLoading();
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [isLoading, finishLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, progress, phase, setLoading, setProgress, finishLoading, enterSite }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
