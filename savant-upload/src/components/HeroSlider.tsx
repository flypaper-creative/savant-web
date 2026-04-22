import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { toast } from 'sonner';
import { TechButton } from './TechButton';
import { useLoading } from '../contexts/LoadingContext';

// Helper to get user data for dynamic prompts
const getUserDataString = () => {
  const time = new Date();
  const hour = time.getHours();
  const timePhase = hour < 5 ? 'dead of night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const res = `${window.innerWidth}x${window.innerHeight}`;
  const agent = navigator.userAgent.includes('Mac') ? 'Macintosh' : navigator.userAgent.includes('Win') ? 'Windows' : 'Unix';
  const randomSeed = Math.floor(Math.random() * 1000000);
  return `Time: ${timePhase} in ${tz}. System: ${agent} at ${res}. Seed: ${randomSeed}.`;
};

const THEMES = [
  "A dynamic, high-energy close-up of a designer's hands manipulating vibrant liquid-ink branding elements on a large glass surface, splashes of gold and neon pink, kinetic motion blur, professional studio lighting, no text, no words, 8k cinematic",
  "A wide-angle shot of a sun-drenched, high-end creative studio, designers collaborating with joy, large-scale physical branding mockups, vibrant color swatches, kinetic energy, industrial-chic aesthetic, no text, no words, 8k cinematic",
  "A kinetic, fast-paced montage of high-impact advertising campaigns on digital billboards in a modern metropolis, vibrant colors, motion trails, reflecting the power of Savant's branding pipeline, no text, no words, 8k cinematic",
  "A macro shot of premium brand materials—embossed paper, metallic foils, and glass—being assembled with precision and care, representing the tactile joy of physical branding, gold accents, no text, no words, 8k cinematic",
  "A kinetic visualization of human and synthetic minds collaborating on a complex branding project, glowing data streams merging with physical sketches, vibrant energy, professional atmosphere, no text, no words, 8k cinematic"
];

const getDynamicPrompts = () => {
  const userData = getUserDataString();
  return THEMES.map(theme => 
    `${theme}. Context: ${userData}. High-fidelity, sleek, modern, powerful, proprietary corporate aesthetic. Palette: blacks, whites, gunmetal, neon-pink, gold.`
  );
};

// Declare window.aistudio
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2574&auto=format&fit=crop"
];

export const HeroSlider = () => {
  const [images, setImages] = useState<string[]>(FALLBACK_IMAGES);
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { setProgress, finishLoading } = useLoading();

  useEffect(() => {
    const init = async () => {
      try {
        let keySelected = false;
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          keySelected = await window.aistudio.hasSelectedApiKey();
          setHasKey(keySelected);
        }

        // Check session cache for neural images
        const cached = sessionStorage.getItem('savant_hero_images');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setImages(parsed);
              setLoading(false);
              setProgress(100);
              finishLoading();
              return;
            }
          } catch (e) {
            sessionStorage.removeItem('savant_hero_images');
          }
        }

        // If we have a key, try to generate, but don't block the UI
        if (keySelected) {
          generateImages().catch(err => {
            console.warn("Background image generation failed, using fallbacks:", err);
          });
        }
        
        // Always finish loading quickly with fallbacks
        setProgress(100);
        finishLoading();
      } catch (err) {
        console.error("HeroSlider initialization failed:", err);
        finishLoading();
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      try {
        await window.aistudio.openSelectKey();
        setHasKey(true);
        generateImages(true).catch(err => {
          console.error("Image generation after key selection failed:", err);
        });
      } catch (err) {
        console.error("Failed to open key selection:", err);
        toast.error("Authentication Error", {
          description: "Could not access the API key selection interface."
        });
      }
    }
  };

  const generateWithRetry = async (ai: any, prompt: string, retries = 2, delay = 1000): Promise<string> => {
    try {
      // Try gemini-2.5-flash-image first as it's more compatible
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });
      
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image data returned from model.");
    } catch (err: any) {
      const status = err?.status || err?.code;
      const message = err?.message || "";
      
      // If 403, it's a permission issue - don't retry, just fail gracefully
      if (status === 403 || message.includes("permission")) {
        throw new Error("PERMISSION_DENIED: Your API key does not have access to image generation or billing is not enabled.");
      }

      if (retries > 0 && (status === 500 || status === 503 || status === 429 || !status)) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return generateWithRetry(ai, prompt, retries - 1, delay * 1.5);
      }
      throw err;
    }
  };

  const generateImages = async (isUserAction = false) => {
    if (!window.aistudio?.hasSelectedApiKey) {
      if (isUserAction) {
        toast.error('API Key Required', {
          description: 'Please select an API key to regenerate images.'
        });
      }
      return;
    }
    
    setLoading(true);
    setError(null);
    if (!isUserAction) setProgress(10);

    try {
      const apiKey = (typeof process !== 'undefined' ? process.env.API_KEY : null) || import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error("API_KEY_NOT_FOUND");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const prompts = getDynamicPrompts();
      
      // Parallelize image generation for speed
      const imagePromises = prompts.map(async (prompt, index) => {
        const img = await generateWithRetry(ai, prompt);
        if (!isUserAction) setProgress(20 + (index + 1) * (70 / prompts.length));
        return img;
      });

      const generatedImages = await Promise.all(imagePromises);
      
      setImages(generatedImages);
      setCurrentIndex(0);
      
      try {
        sessionStorage.setItem('savant_hero_images', JSON.stringify(generatedImages));
      } catch (storageErr) {
        sessionStorage.removeItem('savant_hero_images');
      }

      if (!isUserAction) {
        setProgress(100);
        finishLoading();
      }
    } catch (err: any) {
      console.error("Error generating images:", err);
      let msg = err?.message || "An error occurred during generation.";
      setError(msg);
      if (!isUserAction) finishLoading();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (images.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [images, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  if (!hasKey && images.length === 0) {
    return (
      <div className="w-full aspect-[4/5] sm:aspect-square md:aspect-[21/9] border border-white/10 bg-obsidian/50 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-10 grayscale" />
        <div className="relative z-10 max-w-xl flex flex-col items-center">
          <h2 className="font-display font-black text-3xl md:text-5xl text-white mb-6 tracking-tighter">Initialize Neural Matrix</h2>
          <p className="font-mono text-xs text-white/50 mb-12 leading-relaxed">
            A valid Gemini API key (with billing enabled) is required to generate the high-fidelity sovereign lattice visualizations using nano banana pro.
          </p>
          <TechButton onClick={handleSelectKey} width="w-72" height="h-16" colorClass="bg-gold" borderClass="bg-gold">
            AUTHENTICATE_API_KEY
          </TechButton>
        </div>
      </div>
    );
  }

  if (loading && images.length === 0) {
    return (
      <div className="w-full aspect-[4/5] sm:aspect-square md:aspect-[21/9] border border-gold flex items-center justify-center p-8 text-center">
        <div className="w-16 h-16 border border-gold flex items-center justify-center rotate-45 mb-8">
          <div className="w-8 h-8 bg-gold rotate-45 animate-pulse" />
        </div>
        <div className="font-mono text-xs text-gold tracking-widest animate-pulse">
          SYNTHESIZING_FRACTAL_IMAGERY...
        </div>
        <div className="font-mono text-[9px] text-white/30 mt-4">
          MODEL: gemini-3.1-flash-image-preview
        </div>
      </div>
    );
  }

  if (error && images === FALLBACK_IMAGES) {
    return (
      <div className="w-full aspect-[4/5] sm:aspect-square md:aspect-[21/9] border border-neon-pink/30 bg-obsidian/50 flex flex-col items-center justify-center p-8 text-center">
        <div className="font-mono text-xs text-neon-pink tracking-widest mb-4 ">
          Neural_Synthesis_Failed
        </div>
        <div className="font-mono text-[10px] text-white/50 mb-8 max-w-lg leading-relaxed">
          {error.includes("PERMISSION_DENIED") 
            ? "The selected API key does not have permission for image generation. Please ensure you are using a key from a paid Google Cloud project with the Gemini API enabled." 
            : error}
        </div>
        <div className="flex gap-4">
          <TechButton onClick={handleSelectKey} width="w-48" height="h-12" colorClass="bg-gold" borderClass="bg-gold">
            CHANGE_API_KEY
          </TechButton>
          <TechButton onClick={() => setError(null)} width="w-48" height="h-12" colorClass="bg-white/10" borderClass="bg-white/20">
            USE_FALLBACKS
          </TechButton>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  const slides = [
    {
      title: "Strategic_Branding",
      description: "We craft sovereign identities that command attention and drive market dominance.",
      cta: "EXPLORE_SERVICES"
    },
    {
      title: "Advertising_Impact",
      description: "High-impact campaigns engineered for maximum conversion and cultural resonance.",
      cta: "VIEW_CAMPAIGNS"
    },
    {
      title: "Digital_Architecture",
      description: "Bespoke digital experiences built on recursive fractal logic and elite performance.",
      cta: "OUR_PROCESS"
    },
    {
      title: "Visual_Identity",
      description: "Meticulous design systems that translate strategy into powerful visual geometry.",
      cta: "SEE_PORTFOLIO"
    },
    {
      title: "Creative_Synergy",
      description: "Collaborative intelligence pipelines that merge human vision with synthetic precision.",
      cta: "WORK_WITH_US"
    }
  ];

  return (
    <div className="relative w-full h-full overflow-hidden border-b border-white/10 group">
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          initial={{ opacity: 0, scale: 1.1, filter: 'blur(20px) brightness(0)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px) brightness(1)' }}
          exit={{ opacity: 0, scale: 0.9, filter: 'blur(20px) brightness(0)' }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] contrast-[1.1]"
          loading="lazy"
        />
      </AnimatePresence>
      
      <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none mix-blend-overlay" />
      
      <div className="absolute bottom-0 left-0 w-full p-6 sm:p-12 md:p-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 z-10">
        <div className="space-y-4 w-full max-w-4xl">
          <motion.div 
            key={`meta-${currentIndex}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-mono text-[clamp(8px,1.5vw,10px)] text-neon-pink tracking-[0.5em] uppercase"
          >
            Savant_Canon // Segment_{String(currentIndex + 1).padStart(2, '0')}
          </motion.div>
          
          <motion.h2 
            key={`title-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-black text-[clamp(2rem,10vw,7rem)] text-white tracking-tighter leading-[0.85] uppercase mix-blend-difference break-words"
          >
            {slides[currentIndex].title.split('_').map((word, i) => (
              <span key={i} className="inline-block mr-[0.2em] relative group/word">
                <span className="relative z-10">{word}</span>
                <span className="absolute inset-0 text-neon-pink opacity-0 group-hover/word:opacity-50 group-hover/word:translate-x-1 group-hover/word:translate-y-1 transition-all duration-75 select-none pointer-events-none">
                  {word}
                </span>
                <span className="absolute inset-0 text-gold opacity-0 group-hover/word:opacity-50 group-hover/word:-translate-x-1 group-hover/word:-translate-y-1 transition-all duration-75 select-none pointer-events-none">
                  {word}
                </span>
              </span>
            ))}
          </motion.h2>
          
          <motion.p
            key={`desc-${currentIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            className="font-mono text-[clamp(10px,1.2vw,14px)] text-white max-w-2xl leading-relaxed mt-4"
          >
            {slides[currentIndex].description}
          </motion.p>

          <motion.div
            key={`cta-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-8"
          >
            <TechButton 
              width="w-64" 
              height="h-14" 
              colorClass="bg-white" 
              borderClass="border-white"
              className="text-obsidian font-black"
            >
              {slides[currentIndex].cta}
            </TechButton>
          </motion.div>
        </div>
        
        <div className="flex flex-col items-end gap-8">
          <div className="flex gap-4">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`group relative h-1.5 transition-all duration-700 ease-out ${idx === currentIndex ? 'w-24 bg-neon-pink' : 'w-8 bg-white/10 hover:bg-gold/50'}`}
              >
                <span className={`absolute -top-8 left-0 font-mono text-[10px] transition-all duration-300 ${idx === currentIndex ? 'text-neon-pink opacity-100' : 'text-white/0 group-hover:text-white/40'}`}>
                  0{idx + 1}
                </span>
              </button>
            ))}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handlePrev} 
              className="w-14 h-14 flex items-center justify-center bg-white/5 border border-white/10 text-white/40 hover:text-neon-pink hover:border-neon-pink hover:bg-neon-pink/10 backdrop-blur-xl transition-all font-mono text-2xl"
            >
              &#10094;
            </button>
            <button 
              onClick={handleNext} 
              className="w-14 h-14 flex items-center justify-center bg-white/5 border border-white/10 text-white/40 hover:text-neon-pink hover:border-neon-pink hover:bg-neon-pink/10 backdrop-blur-xl transition-all font-mono text-2xl"
            >
              &#10095;
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 animate-bounce pointer-events-none">
        <div className="font-mono text-[8px] text-white tracking-widest uppercase">Scroll_to_Explore</div>
        <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
      </div>

      {/* Regenerate Button (Always visible, styled aggressively) */}
      <div className="absolute top-8 right-8 z-20">
        <TechButton 
          onClick={() => generateImages(true)}
          disabled={loading}
          width="w-auto px-6"
          height="h-10"
          colorClass="bg-neon-pink"
          borderClass="border-neon-pink"
          className="opacity-70 hover:opacity-100"
        >
          {loading ? 'ITERATING...' : 'REGENERATE_VISION'}
        </TechButton>
      </div>
    </div>
  );
};
