import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export type LoadingPhase = 'booting' | 'cinematic' | 'transition' | 'complete';

interface LoadingContextType {
  isLoading: boolean;
  progress: number;
  phase: LoadingPhase;
  setLoading: (loading: boolean) => void;
  setProgress: (progress: number) => void;
  finishLoading: () => void;
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

  const finishLoading = useCallback(() => {
    if (hasFinished.current) return;
    hasFinished.current = true;
    
    setProgress(100);
    const elapsed = Date.now() - startTime.current;
    // 7 seconds total cinematic time (2s spin-in + 5s wait)
    const remainingTo7s = Math.max(0, 7000 - elapsed);

    setPhase('cinematic');

    // Wait for the 7-second mark to start the transition
    setTimeout(() => {
      setPhase('transition');
      
      // Transition takes 1.5 seconds
      setTimeout(() => {
        setPhase('complete');
        setIsLoading(false);
      }, 1500);
    }, remainingTo7s);
  }, []);

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
    <LoadingContext.Provider value={{ isLoading, progress, phase, setLoading, setProgress, finishLoading }}>
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