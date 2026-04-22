import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { TechButton } from './TechButton';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { X, Shield, LayoutDashboard, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogin = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/admin'
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Login failed:", error);
      toast.error(`AUTHENTICATION_FAILED: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('SESSION_TERMINATED');
      onClose();
    } catch (error: any) {
      console.error("Logout failed:", error);
      toast.error(`TERMINATION_FAILED: ${error.message}`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] cursor-pointer"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-obsidian border-l border-white/10 z-[101] p-12 flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Scanning Line */}
            <motion.div 
              className="absolute inset-0 w-full h-[1px] bg-neon-pink/10 z-0 pointer-events-none"
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />

            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-1 h-full bg-neon-pink/50" />
            <div className="absolute top-0 right-0 p-4 font-mono text-[9px] text-white/20 tracking-widest uppercase">
              Admin_Access_Terminal
            </div>

            <div className="flex justify-between items-center mb-16">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 border border-neon-pink flex items-center justify-center">
                  <Shield className="w-4 h-4 text-neon-pink" />
                </div>
                <h2 className="font-display font-black text-3xl text-white tracking-tighter uppercase">
                  Sovereign_Auth
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 transition-colors duration-300 group"
              >
                <X className="w-6 h-6 text-white/40 group-hover:text-neon-pink transition-colors duration-300" />
              </button>
            </div>

            <div className="flex-1">
              {!user ? (
                <div className="space-y-8">
                  <p className="font-mono text-xs text-white/40 leading-relaxed tracking-widest">
                    Restricted access node. Authentication via Google required to establish administrative uplink.
                  </p>
                  
                  <TechButton 
                    onClick={handleLogin}
                    width="w-full"
                    height="h-16"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'PROCESSING...' : 'AUTHENTICATE_VIA_GOOGLE'}
                  </TechButton>
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="p-6 border border-white/5 bg-white/[0.02] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 font-mono text-[8px] text-gold tracking-widest">ACTIVE_SESSION</div>
                    <div className="flex items-center gap-4 mb-4">
                      {user.user_metadata.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="" className="w-12 h-12 rounded-none border border-white/10" />
                      ) : (
                        <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center font-mono text-white/20">
                          {user.email?.[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-display font-bold text-white text-lg tracking-tight truncate max-w-[200px]">
                          {user.user_metadata.full_name || user.email}
                        </div>
                        <div className="font-mono text-[9px] text-white/30 tracking-widest uppercase">
                          {isAdmin ? 'CLEARANCE: LEVEL_ADMIN' : 'CLEARANCE: LEVEL_USER'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {isAdmin && (
                      <Link to="/admin" onClick={onClose} className="block group">
                        <div className="p-6 border border-white/10 bg-white/5 hover:bg-neon-pink/10 hover:border-neon-pink/30 transition-all duration-500 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <LayoutDashboard className="w-5 h-5 text-neon-pink" />
                            <span className="font-mono text-xs font-bold text-white tracking-widest uppercase">Command_Center</span>
                          </div>
                          <div className="w-2 h-2 bg-neon-pink" />
                        </div>
                      </Link>
                    )}

                    <button 
                      onClick={handleLogout} 
                      className="w-full group text-left"
                      disabled={isLoggingOut}
                    >
                      <div className="p-6 border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-500 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <LogOut className="w-5 h-5 text-white/40 group-hover:text-white transition-colors duration-500" />
                          <span className="font-mono text-xs font-bold text-white/40 group-hover:text-white tracking-widest transition-colors duration-500 uppercase">
                            {isLoggingOut ? 'Terminating...' : 'Terminate_Session'}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-12 border-t border-white/5 font-mono text-[8px] text-white/10 tracking-[0.5em] uppercase text-center">
              build_42_omega // secure_uplink_established
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};