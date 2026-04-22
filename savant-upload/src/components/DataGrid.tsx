import React from 'react';
import { motion } from 'motion/react';

interface DataItem {
  id: string;
  label: string;
  value: string | number;
  status: 'OPTIMAL' | 'CRITICAL' | 'SYNCING' | 'OFFLINE';
  meta?: string;
}

interface DataGridProps {
  data: DataItem[];
  title?: string;
  className?: string;
}

export const DataGrid: React.FC<DataGridProps> = ({ data, title, className = "" }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
          <h3 className="font-mono text-[10px] text-white/40 tracking-[0.5em] ">{title}</h3>
          <div className="flex gap-2">
            <div className="w-1 h-1 bg-neon-pink rounded-full animate-pulse" />
            <div className="w-1 h-1 bg-gold rounded-full animate-pulse delay-75" />
            <div className="w-1 h-1 bg-white rounded-full animate-pulse delay-150" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 px-4 mb-4">
        <span className="col-header">ID</span>
        <span className="col-header">ENTITY_LABEL</span>
        <span className="col-header">METRIC_VAL</span>
        <span className="col-header">STATUS</span>
      </div>

      <div className="space-y-1">
        {data.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="data-row group"
          >
            <span className="data-value text-white/20 group-hover:text-white/40">{item.id}</span>
            <span className="data-value text-white font-bold">{item.label}</span>
            <span className="data-value text-gold">{item.value}</span>
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full ${
                item.status === 'OPTIMAL' ? 'bg-emerald-500' :
                item.status === 'CRITICAL' ? 'bg-neon-pink' :
                item.status === 'SYNCING' ? 'bg-gold' : 'bg-white/20'
              }`} />
              <span className={`data-value text-[9px] ${
                item.status === 'OPTIMAL' ? 'text-emerald-500/50' :
                item.status === 'CRITICAL' ? 'text-neon-pink/50' :
                item.status === 'SYNCING' ? 'text-gold/50' : 'text-white/20'
              }`}>{item.status}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
