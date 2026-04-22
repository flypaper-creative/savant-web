import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, Loader2, X } from 'lucide-react';

interface NeuralSummaryProps {
  content: string;
  title: string;
}

export const NeuralSummary: React.FC<NeuralSummaryProps> = ({ content, title }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const generateWithRetry = async (ai: any, params: any, retries = 2, delay = 1000): Promise<any> => {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      const status = err?.status || err?.code;
      const message = err?.message || "";

      if (status === 403 || message.includes("permission")) {
        throw new Error("PERMISSION_DENIED: Your API key does not have access to this model or billing is not enabled.");
      }

      if (retries > 0 && (status === 500 || status === 503 || status === 429 || !status)) {
        console.warn(`Retrying AI generation. Retries left: ${retries}. Error:`, err);
        await new Promise(resolve => setTimeout(resolve, delay));
        return generateWithRetry(ai, params, retries - 1, delay * 2);
      }
      throw err;
    }
  };

  const generateSummary = async () => {
    if (summary) {
      setIsOpen(true);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    try {
      // @ts-ignore
      const apiKey = (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : null) || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY_NOT_FOUND");
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await generateWithRetry(ai, {
        model: 'gemini-3-flash-preview',
        contents: `Summarize this journal entry titled "${title}" in a concise, ultra-sophisticated, and slightly cryptic "Savant" tone. Focus on the core neural insights. Content: ${content.substring(0, 2000)}`,
        config: {
          systemInstruction: "You are the Savant Neural Interface. Your summaries are brief, profound, and use technical/philosophical terminology. Max 3 sentences.",
        }
      });

      setSummary(response.text || "NEURAL_LINK_FAILURE: Could not synthesize summary.");
    } catch (error: any) {
      console.error('Neural Summary Error:', error);
      setSummary(`ERROR_CODE_404: ${error?.message || 'Neural pathways blocked.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button 
        onClick={generateSummary}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-gold/50 transition-all group"
      >
        <Brain className="w-3 h-3 text-gold group-hover:animate-pulse" />
        <span className="font-mono text-[9px] text-white/50 group-hover:text-white tracking-widest ">Neural_Summary</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-4 w-72 p-4 bg-industrial-gray border border-electric-gold/30 shadow-2xl z-50 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-gold" />
                <span className="font-mono text-[9px] text-gold tracking-widest uppercase">Neural_Synthesis</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/30 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="w-6 h-6 text-gold animate-spin" />
                <span className="font-mono text-[8px] text-white/30 animate-pulse">SYNTHESIZING...</span>
              </div>
            ) : (
              <div className="font-serif italic text-sm text-white/90 leading-relaxed">
                "{summary}"
              </div>
            )}

            <div className="absolute -bottom-2 left-4 w-4 h-4 bg-industrial-gray border-r border-b border-gold/30 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
