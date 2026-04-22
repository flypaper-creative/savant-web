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
  { id: '1', text: 'realize_neural_uplink_protocol', completed: false, priority: 'HIGH', category: 'engineering' },
  { id: '2', text: 'decrypt_oblivion_vault_sectors', completed: true, priority: 'MEDIUM', category: 'security' },
  { id: '3', text: 'sync_spatial_lattice_nodes', completed: false, priority: 'HIGH', category: 'infrastructure' },
  { id: '4', text: 'optimize_quantum_entanglement', completed: false, priority: 'LOW', category: 'research' },
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
      text: newTask.toLowerCase(),
      completed: false,
      priority: 'MEDIUM',
      category: 'general'
    };
    setTasks([task, ...tasks]);
    setNewTask('');
  };

  return (
    <div className="w-full h-full flex flex-col bg-current/5 rounded-xl overflow-hidden border border-current/5 font-mono p-6 text-current">
      <div className="flex items-center justify-between mb-8">
        <div className="savant-stack !gap-2">
          <h2 className="text-[#E6C03B] text-xs tracking-[0.4em] font-black">mission_objectives</h2>
          <p className="opacity-20 text-[8px] tracking-widest">strategic_task_management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-current/5 border border-current/10 rounded text-[9px] opacity-40 font-bold tracking-widest">
            <Clock className="w-3 h-3" />
            {tasks.filter(t => !t.completed).length} active
          </div>
        </div>
      </div>

      <form onSubmit={addTask} className="mb-8 flex gap-4">
        <div className="flex-1 relative group">
          <div className="absolute inset-0 bg-[#E6C03B]/5 blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <input 
            type="text" 
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="initialize_new_objective..."
            className="w-full bg-current/5 border border-current/10 rounded-lg px-4 py-3 text-[10px] text-current outline-none focus:border-[#E6C03B]/50 transition-all placeholder:opacity-10 tracking-widest relative z-10"
          />
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 bg-[#E6C03B] text-black rounded-lg font-black text-[10px] tracking-widest flex items-center gap-2 hover:bg-[#E6C03B]/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          add
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
                  ? 'bg-current/5 border-current/5 opacity-50' 
                  : 'bg-current/5 border-current/10 hover:border-[#E6C03B]/30 hover:bg-current/10'
              }`}
            >
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                onClick={() => toggleTask(task.id)}
                className={`shrink-0 transition-colors ${task.completed ? 'text-emerald-500' : 'opacity-20 group-hover:opacity-40'}`}
              >
                {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </motion.button>

              <div className="flex-1 min-w-0">
                <div className={`text-[10px] tracking-widest transition-all duration-500 ${
                  task.completed ? 'line-through opacity-20' : 'text-current'
                }`}>
                  {task.text}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`text-[7px] px-1.5 py-0.5 rounded border tracking-widest font-bold ${
                    task.priority === 'HIGH' ? 'bg-[#FF4068]/10 border-[#FF4068]/20 text-[#FF4068]' :
                    task.priority === 'MEDIUM' ? 'bg-[#E6C03B]/10 border-[#E6C03B]/20 text-[#E6C03B]' :
                    'bg-current/5 border-current/10 opacity-30'
                  }`}>
                    {task.priority.toLowerCase()}
                  </div>
                  <div className="flex items-center gap-1 text-[7px] opacity-20 tracking-widest">
                    <Tag className="w-2 h-2" />
                    {task.category.toLowerCase()}
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, color: '#FF4068' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-current/20"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-6 pt-6 border-t border-current/5 flex justify-between items-center">
        <div className="flex gap-2">
          {['all', 'active', 'completed'].map(filter => (
            <button key={filter} className="text-[8px] opacity-20 hover:opacity-100 transition-colors tracking-widest">
              {filter}
            </button>
          ))}
        </div>
        <div className="text-[8px] opacity-10 tracking-widest">
          system_integrity: optimal
        </div>
      </div>
    </div>
  );
};
