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
    toast.success('api_key_stored: sovereign access updated.');
  };

  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem('SAVANT_API_KEY');
    toast.success('api_key_purged: local storage cleared.');
  };

  return (
    <div className="savant-page-container bg-current/5 text-current">
      <div className="noise-overlay opacity-5" />
      
      <div className="relative z-10 savant-stack">
        <header className="min-h-[40vh] flex flex-col justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="savant-stack !gap-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-[1px] bg-[#FF4068]" />
              <span className="font-mono text-[10px] text-[#FF4068] tracking-[0.6em] font-bold">system_core // config</span>
            </div>
            <h1 className="text-massive font-display">
              system_<br />
              <span className="text-[#FF4068] italic font-serif font-light text-[0.7em]">settings.</span>
            </h1>
          </motion.div>
        </header>

        <div className="savant-grid grid-cols-1 lg:grid-cols-2 !gap-12">
          <section className="p-12 border border-current/5 bg-current/5 backdrop-blur-3xl relative overflow-hidden group rounded-[3rem]">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#FF4068] opacity-50" />
            
            <div className="flex items-center gap-6 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-[#FF4068]/10 flex items-center justify-center">
                <Key className="text-[#FF4068]" size={24} />
              </div>
              <h2 className="font-display text-3xl tracking-tight">api_key_configuration</h2>
            </div>

            <p className="opacity-30 font-mono text-[10px] mb-10 leading-relaxed tracking-widest">
              configure your sovereign access key for external service integration. 
              this key is stored locally in your browser and never leaves your machine.
            </p>

            <div className="savant-stack !gap-8">
              <div className="savant-stack !gap-4">
                <label className="font-mono text-[9px] opacity-20 tracking-widest block">
                  access_key_secret
                </label>
                <div className="relative">
                  <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="enter_sovereign_key..."
                    className="w-full bg-current/5 border border-current/10 p-6 font-mono text-sm text-current focus:outline-none focus:border-[#FF4068] transition-colors rounded-2xl"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-[#FF4068] animate-pulse' : 'bg-current/10'}`} />
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
                      save_config
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
                      purge_key
                    </span>
                  </SavantButton>
                </MagneticButton>
              </div>
            </div>

            {debouncedKey && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-10 p-6 bg-current/5 border-l-2 border-[#E6C03B] font-mono text-[9px] opacity-40 tracking-widest rounded-r-2xl"
              >
                <span className="text-[#E6C03B]">status:</span> key_detected_in_buffer // {debouncedKey.substring(0, 4)}****{debouncedKey.substring(debouncedKey.length - 4)}
              </motion.div>
            )}
          </section>

          <section className="p-12 border border-current/5 bg-current/5 backdrop-blur-3xl relative overflow-hidden group rounded-[3rem]">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#E6C03B] opacity-50" />
            
            <div className="flex items-center gap-6 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-[#E6C03B]/10 flex items-center justify-center">
                <Save className="text-[#E6C03B]" size={24} />
              </div>
              <h2 className="font-display text-3xl tracking-tight">source_extraction_v80</h2>
            </div>

            <p className="opacity-30 font-mono text-[10px] mb-10 leading-relaxed tracking-widest">
              initiate a full-spectrum extraction of the savant os codebase. 
              this will generate a source dump, file tree, and archive it to github and s3.
            </p>

            <MagneticButton strength={0.1}>
              <SavantButton 
                onClick={async () => {
                  try {
                    const promise = fetch('/api/extract', { method: 'POST' });
                    toast.promise(promise, {
                      loading: 'initiating_extraction_sequence...',
                      success: 'extraction_complete: archive deployed.',
                      error: 'extraction_failure: check system logs.'
                    });
                    await promise;
                  } catch (error) {
                    console.error('Extraction failed:', error);
                  }
                }}
                variant="primary"
                className="w-full h-20 bg-[#E6C03B] border-[#E6C03B] text-black"
              >
                <span className="flex items-center gap-3">
                  <Save size={18} />
                  run_extractor_v80
                </span>
              </SavantButton>
            </MagneticButton>
          </section>

          <section className="lg:col-span-2 p-12 border border-current/5 bg-current/5 rounded-[3rem] opacity-40">
            <h2 className="font-display text-2xl tracking-tight mb-8">system_telemetry</h2>
            <div className="savant-grid grid-cols-2 md:grid-cols-4 !gap-12 font-mono text-[9px] opacity-30 tracking-[0.4em]">
              <div>
                <div className="mb-2">local_storage</div>
                <div className="text-[#E6C03B]">enabled</div>
              </div>
              <div>
                <div className="mb-2">encryption</div>
                <div className="text-[#E6C03B]">aes_256_local</div>
              </div>
              <div>
                <div className="mb-2">sync_status</div>
                <div className="text-[#E6C03B]">offline_only</div>
              </div>
              <div>
                <div className="mb-2">node_id</div>
                <div>{Math.random().toString(36).substring(2, 10).toLowerCase()}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
