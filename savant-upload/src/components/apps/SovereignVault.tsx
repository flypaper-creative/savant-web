import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Folder, File, Shield, Lock, Search, ChevronRight, Download, Eye, Share2 } from 'lucide-react';

const FILES = [
  { id: '01', name: 'BRAND_GUIDELINES_v2.pdf', type: 'PDF', size: '12.4MB', date: '2026-04-01', status: 'LOCKED' },
  { id: '02', name: 'OBLIVION_ASSETS.zip', type: 'ZIP', size: '2.8GB', date: '2026-03-28', status: 'SECURE' },
  { id: '03', name: 'STRATEGY_DECK_Q2.pptx', type: 'PPTX', size: '45.2MB', date: '2026-04-03', status: 'LOCKED' },
  { id: '04', name: 'NEURAL_LATTICE_CORE.bin', type: 'BIN', size: '1.2TB', date: '2026-04-04', status: 'ENCRYPTED' },
  { id: '05', name: 'CAMPAIGN_VAULT_MANIFEST.json', type: 'JSON', size: '1.2MB', date: '2026-04-02', status: 'SECURE' },
];

export const SovereignVault: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<typeof FILES[0] | null>(null);
  const [search, setSearch] = useState('');

  const filteredFiles = FILES.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full h-full flex flex-col bg-black/40 rounded-xl overflow-hidden border border-white/5 font-mono">
      {/* Search Bar */}
      <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
        <Search className="w-4 h-4 text-white/20" />
        <input 
          type="text" 
          placeholder="SEARCH_VAULT..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-white text-xs flex-1 placeholder:text-white/10 tracking-widest"
        />
        <div className="flex items-center gap-2 px-3 py-1 bg-neon-pink/10 border border-neon-pink/20 rounded text-[9px] text-neon-pink font-bold tracking-widest">
          <Shield className="w-3 h-3" />
          SECURE_ACCESS
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* File List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {filteredFiles.map((file) => (
            <motion.button
              key={file.id}
              onClick={() => setSelectedFile(file)}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 border ${
                selectedFile?.id === file.id ? 'bg-white/10 border-white/10' : 'hover:bg-white/5 border-transparent'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${selectedFile?.id === file.id ? 'bg-neon-pink text-white' : 'bg-white/5 text-white/40'}`}>
                  {file.status === 'LOCKED' ? <Lock className="w-4 h-4" /> : <File className="w-4 h-4" />}
                </div>
                <div className="text-left">
                  <div className={`text-[11px] tracking-widest mb-1 ${selectedFile?.id === file.id ? 'text-white' : 'text-white/60'}`}>
                    {file.name}
                  </div>
                  <div className="text-[8px] text-white/20  tracking-[0.3em]">
                    {file.type} // {file.size} // {file.date}
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${selectedFile?.id === file.id ? 'text-neon-pink translate-x-1' : 'text-white/10'}`} />
            </motion.button>
          ))}
        </div>

        {/* File Details */}
        <AnimatePresence mode="wait">
          {selectedFile && (
            <motion.div
              key={selectedFile.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-80 border-l border-white/5 bg-white/[0.01] p-8 flex flex-col"
            >
              <div className="flex-1">
                <div className="w-full aspect-square bg-white/5 rounded-2xl mb-8 flex items-center justify-center border border-white/5 relative group">
                  <div className="absolute inset-0 bg-neon-pink/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <File className="w-16 h-16 text-white/10 group-hover:text-neon-pink/40 transition-colors" />
                </div>
                
                <h3 className="text-white text-sm tracking-widest mb-4 uppercase">{selectedFile.name}</h3>
                
                <div className="space-y-4 mb-10">
                  {[
                    { label: 'STATUS', val: selectedFile.status, color: 'text-neon-pink' },
                    { label: 'OWNER', val: 'SAVANT_ROOT', color: 'text-white/40' },
                    { label: 'ENCRYPTION', val: 'AES_256_ULTRA', color: 'text-white/40' },
                    { label: 'ACCESS_LOGS', val: '04_ENTRIES', color: 'text-white/40' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between text-[9px] tracking-widest border-b border-white/5 pb-2">
                      <span className="text-white/20 uppercase">{item.label}</span>
                      <span className={item.color}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] text-white/60 tracking-widest transition-all">
                  <Eye className="w-3 h-3" />
                  PREVIEW
                </button>
                <button className="flex items-center justify-center gap-2 p-3 bg-neon-pink text-white rounded-lg text-[9px] font-bold tracking-widest hover:bg-neon-pink/80 transition-all">
                  <Download className="w-3 h-3" />
                  DECRYPT
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-between items-center text-[8px] text-white/20 tracking-[0.5em] uppercase">
        <div>STORAGE_USED: 1.24TB / 10TB</div>
        <div>ENCRYPTION_ENGINE: ACTIVE</div>
      </div>
    </div>
  );
};
