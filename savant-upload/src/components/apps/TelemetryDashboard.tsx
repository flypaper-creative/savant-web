import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const generateData = () => {
  const data = [];
  for (let i = 0; i < 20; i++) {
    data.push({
      time: i,
      value: Math.floor(Math.random() * 100),
      latency: Math.floor(Math.random() * 10),
      load: Math.floor(Math.random() * 1000)
    });
  }
  return data;
};

export const TelemetryDashboard: React.FC = () => {
  const [data, setData] = useState(generateData());

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1), {
          time: prev[prev.length - 1].time + 1,
          value: Math.floor(Math.random() * 100),
          latency: Math.floor(Math.random() * 10),
          load: Math.floor(Math.random() * 1000)
        }];
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6 font-mono text-[10px] bg-black/40 rounded-xl overflow-hidden border border-white/5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 border border-white/5 bg-white/[0.02] rounded-lg">
          <div className="text-white/40 mb-2 tracking-[0.4em] ">SYSTEM_LOAD</div>
          <div className="text-2xl font-tech font-bold text-neon-pink">{data[data.length - 1].load} TH/s</div>
        </div>
        <div className="p-4 border border-white/5 bg-white/[0.02] rounded-lg">
          <div className="text-white/40 mb-2 tracking-[0.4em] uppercase">GLOBAL_LATENCY</div>
          <div className="text-2xl font-tech font-bold text-gold">{data[data.length - 1].latency}ms</div>
        </div>
        <div className="p-4 border border-white/5 bg-white/[0.02] rounded-lg">
          <div className="text-white/40 mb-2 tracking-[0.4em] uppercase">ACTIVE_NODES</div>
          <div className="text-2xl font-tech font-bold text-white">4,281</div>
        </div>
      </div>

      <div className="flex-1 min-h-[200px] border border-white/5 bg-white/[0.01] rounded-lg p-4">
        <div className="text-white/40 mb-4 tracking-[0.4em] uppercase">NEURAL_THROUGHPUT</div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff4068" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ff4068" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}
              itemStyle={{ color: '#ff4068' }}
            />
            <Area type="monotone" dataKey="value" stroke="#ff4068" fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border border-white/5 bg-white/[0.02] rounded-lg h-32">
          <div className="text-white/40 mb-2 tracking-[0.4em] uppercase">LATENCY_LOG</div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line type="monotone" dataKey="latency" stroke="#e6c03b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="p-4 border border-white/5 bg-white/[0.02] rounded-lg h-32">
          <div className="text-white/40 mb-2 tracking-[0.4em] uppercase">SYSTEM_LOGS</div>
          <div className="space-y-1 opacity-40 overflow-hidden">
            <div>[OK] NODE_0x42 INITIALIZED</div>
            <div>[OK] UPLINK_STABLE</div>
            <div>[WARN] LATENCY_SPIKE_DETECTED</div>
            <div>[OK] NEURAL_LATTICE_SYNCED</div>
          </div>
        </div>
      </div>
    </div>
  );
};
