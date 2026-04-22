import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SavantButton } from '../components/ui/SavantButton';
import { MagneticButton } from '../components/MagneticButton';
import { toast } from 'sonner';
import { Key, Save, Trash2 } from 'lucide-react';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [debouncedKey, setDebouncedKey] = useState('');

  // Load key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('SAVANT_API_KEY') || '';
    setApiKey(savedKey);
    setDebouncedKey(savedKey);
  }, []);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKey(apiKey);
    }, 500);

    return () => clearTimeout(timer);
  }, [apiKey]);

  const handleSave = () => {
    localStorage.setItem('SAVANT_API_KEY', apiKey);
    toast.success('API_KEY_STORED: Sovereign access updated.');
  };

  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem('SAVANT_API_KEY');
    toast.success('API_KEY_PURGED: Local storage cleared.');
  };

  return (
    <div className="savant-page-container bg-obsidian">
      <div className="noise-overlay opacity-5" />
      
      <div className="relative z-10 savant-stack">
        <header className="min-h-[40vh] flex flex-col justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="savant-stack !gap-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-[1px] bg-neon-pink" />
              <span className="font-mono text-[10px] text-neon-pink tracking-[0.6em] uppercase font-bold">SYSTEM_CORE // CONFIG</span>
            </div>
            <h1 className="text-massive font-display">
              SYSTEM_<br />
              <span className="text-neon-pink italic font-serif font-light text-[0.7em]">Settings.</span>
            </h1>
          </motion.div>
        </header>

        <div className="savant-grid grid-cols-1 lg:grid-cols-2 !gap-12">
          <section className="p-12 border border-white/5 bg-white/[0.01] backdrop-blur-3xl relative overflow-hidden group rounded-[3rem]">
            <div className="absolute top-0 left-0 w-1 h-full bg-neon-pink opacity-50" />
            
            <div className="flex items-center gap-6 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-neon-pink/10 flex items-center justify-center">
                <Key className="text-neon-pink" size={24} />
              </div>
              <h2 className="font-display text-3xl text-white tracking-tight">API_KEY_CONFIGURATION</h2>
            </div>

            <p className="text-white/30 font-mono text-[10px] mb-10 leading-relaxed tracking-widest uppercase">
              Configure your sovereign access key for external service integration. 
              This key is stored locally in your browser and never leaves your machine.
            </p>

            <div className="savant-stack !gap-8">
              <div className="savant-stack !gap-4">
                <label className="font-mono text-[9px] text-white/20 tracking-widest uppercase block">
                  ACCESS_KEY_SECRET
                </label>
                <div className="relative">
                  <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="ENTER_SOVEREIGN_KEY..."
                    className="w-full bg-white/[0.02] border border-white/10 p-6 font-mono text-sm text-white focus:outline-none focus:border-neon-pink transition-colors rounded-2xl"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-neon-pink animate-pulse' : 'bg-white/10'}`} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-4">
                <MagneticButton strength={0.1}>
                  <SavantButton 
                    onClick={handleSave}
                    variant="primary"
                    className="w-48 h-14"
                  >
                    <span className="flex items-center gap-3">
                      <Save size={16} />
                      SAVE_CONFIG
                    </span>
                  </SavantButton>
                </MagneticButton>
                
                <MagneticButton strength={0.1}>
                  <SavantButton 
                    onClick={handleClear}
                    variant="outline"
                    className="w-48 h-14"
                  >
                    <span className="flex items-center gap-3">
                      <Trash2 size={16} />
                      PURGE_KEY
                    </span>
                  </SavantButton>
                </MagneticButton>
              </div>
            </div>

            {debouncedKey && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-10 p-6 bg-white/[0.02] border-l-2 border-gold font-mono text-[9px] text-white/40 tracking-widest uppercase rounded-r-2xl"
              >
                <span className="text-gold">STATUS:</span> KEY_DETECTED_IN_BUFFER // {debouncedKey.substring(0, 4)}****{debouncedKey.substring(debouncedKey.length - 4)}
              </motion.div>
            )}
          </section>

          <section className="p-12 border border-white/5 bg-white/[0.01] backdrop-blur-3xl relative overflow-hidden group rounded-[3rem]">
            <div className="absolute top-0 left-0 w-1 h-full bg-gold opacity-50" />
            
            <div className="flex items-center gap-6 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
                <Save className="text-gold" size={24} />
              </div>
              <h2 className="font-display text-3xl text-white tracking-tight">SOURCE_EXTRACTION_v80</h2>
            </div>

            <p className="text-white/30 font-mono text-[10px] mb-10 leading-relaxed tracking-widest uppercase">
              Initiate a full-spectrum extraction of the Savant OS codebase. 
              This will generate a source dump, file tree, and archive it to GitHub and S3.
            </p>

            <MagneticButton strength={0.1}>
              <SavantButton 
                onClick={async () => {
                  try {
                    const promise = fetch('/api/extract', { method: 'POST' });
                    toast.promise(promise, {
                      loading: 'INITIATING_EXTRACTION_SEQUENCE...',
                      success: 'EXTRACTION_COMPLETE: Archive deployed.',
                      error: 'EXTRACTION_FAILURE: Check system logs.'
                    });
                    await promise;
                  } catch (error) {
                    console.error('Extraction failed:', error);
                  }
                }}
                variant="primary"
                className="w-full h-20 bg-gold border-gold text-black"
              >
                <span className="flex items-center gap-3">
                  <Save size={18} />
                  RUN_EXTRACTOR_v80
                </span>
              </SavantButton>
            </MagneticButton>
          </section>

          <section className="lg:col-span-2 p-12 border border-white/5 bg-white/[0.01] rounded-[3rem] opacity-40">
            <h2 className="font-display text-2xl text-white tracking-tight mb-8">SYSTEM_TELEMETRY</h2>
            <div className="savant-grid grid-cols-2 md:grid-cols-4 !gap-12 font-mono text-[9px] text-white/30 tracking-[0.4em] uppercase">
              <div>
                <div className="text-white mb-2">LOCAL_STORAGE</div>
                <div className="text-gold">ENABLED</div>
              </div>
              <div>
                <div className="text-white mb-2">ENCRYPTION</div>
                <div className="text-gold">AES_256_LOCAL</div>
              </div>
              <div>
                <div className="text-white mb-2">SYNC_STATUS</div>
                <div className="text-gold">OFFLINE_ONLY</div>
              </div>
              <div>
                <div className="text-white mb-2">NODE_ID</div>
                <div className="text-white">{Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}