import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, Plus, Trash2, AlertCircle, Clock, Tag } from 'lucide-react';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: string;
}

const INITIAL_TASKS: Task[] = [
  { id: '1', text: 'REALIZE_NEURAL_UPLINK_PROTOCOL', completed: false, priority: 'HIGH', category: 'ENGINEERING' },
  { id: '2', text: 'DECRYPT_OBLIVION_VAULT_SECTORS', completed: true, priority: 'MEDIUM', category: 'SECURITY' },
  { id: '3', text: 'SYNC_SPATIAL_LATTICE_NODES', completed: false, priority: 'HIGH', category: 'INFRASTRUCTURE' },
  { id: '4', text: 'OPTIMIZE_QUANTUM_ENTANGLEMENT', completed: false, priority: 'LOW', category: 'RESEARCH' },
];

export const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [newTask, setNewTask] = useState('');

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const task: Task = {
      id: Math.random().toString(36).substring(2, 9),
      text: newTask.toUpperCase(),
      completed: false,
      priority: 'MEDIUM',
      category: 'GENERAL'
    };
    setTasks([task, ...tasks]);
    setNewTask('');
  };

  return (
    <div className="w-full h-full flex flex-col bg-black/40 rounded-xl overflow-hidden border border-white/5 font-mono p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="savant-stack !gap-2">
          <h2 className="text-gold text-xs tracking-[0.4em] font-black uppercase">Mission_Objectives</h2>
          <p className="text-white/20 text-[8px] tracking-widest uppercase">Strategic_Task_Management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded text-[9px] text-white/40 font-bold tracking-widest">
            <Clock className="w-3 h-3" />
            {tasks.filter(t => !t.completed).length} ACTIVE
          </div>
        </div>
      </div>

      <form onSubmit={addTask} className="mb-8 flex gap-4">
        <div className="flex-1 relative group">
          <div className="absolute inset-0 bg-gold/5 blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <input 
            type="text" 
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="INITIALIZE_NEW_OBJECTIVE..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-[10px] text-white outline-none focus:border-gold/50 transition-all placeholder:text-white/10 tracking-widest relative z-10"
          />
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 bg-gold text-obsidian rounded-lg font-black text-[10px] tracking-widest flex items-center gap-2 hover:bg-gold/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          ADD
        </motion.button>
      </form>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ 
                type: 'spring', 
                stiffness: 500, 
                damping: 30,
                opacity: { duration: 0.2 }
              }}
              className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${
                task.completed 
                  ? 'bg-white/[0.02] border-white/5 opacity-50' 
                  : 'bg-white/[0.05] border-white/10 hover:border-gold/30 hover:bg-white/[0.08]'
              }`}
            >
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                onClick={() => toggleTask(task.id)}
                className={`shrink-0 transition-colors ${task.completed ? 'text-emerald-500' : 'text-white/20 group-hover:text-white/40'}`}
              >
                {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </motion.button>

              <div className="flex-1 min-w-0">
                <div className={`text-[10px] tracking-widest transition-all duration-500 ${
                  task.completed ? 'line-through text-white/20' : 'text-white'
                }`}>
                  {task.text}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`text-[7px] px-1.5 py-0.5 rounded border tracking-widest font-bold ${
                    task.priority === 'HIGH' ? 'bg-neon-pink/10 border-neon-pink/20 text-neon-pink' :
                    task.priority === 'MEDIUM' ? 'bg-gold/10 border-gold/20 text-gold' :
                    'bg-white/5 border-white/10 text-white/30'
                  }`}>
                    {task.priority}
                  </div>
                  <div className="flex items-center gap-1 text-[7px] text-white/20 tracking-widest uppercase">
                    <Tag className="w-2 h-2" />
                    {task.category}
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, color: '#ff4068' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-white/20"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
        <div className="flex gap-2">
          {['ALL', 'ACTIVE', 'COMPLETED'].map(filter => (
            <button key={filter} className="text-[8px] text-white/20 hover:text-white transition-colors tracking-widest uppercase">
              {filter}
            </button>
          ))}
        </div>
        <div className="text-[8px] text-white/10 tracking-widest uppercase">
          System_Integrity: Optimal
        </div>
      </div>
    </div>
  );
};