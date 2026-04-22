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
      toast.error(`authentication_failed: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('session_terminated');
      onClose();
    } catch (error: any) {
      console.error("Logout failed:", error);
      toast.error(`termination_failed: ${error.message}`);
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
            className="fixed top-0 right-0 h-full w-full max-w-md bg-current/5 backdrop-blur-3xl border-l border-current/10 z-[101] p-12 flex flex-col shadow-2xl overflow-hidden text-current"
          >
            {/* Scanning Line */}
            <motion.div 
              className="absolute inset-0 w-full h-[1px] bg-[#FF4068]/10 z-0 pointer-events-none"
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />

            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-1 h-full bg-[#FF4068]/50" />
            <div className="absolute top-0 right-0 p-4 font-mono text-[9px] opacity-20 tracking-widest">
              admin_access_terminal
            </div>

            <div className="flex justify-between items-center mb-16">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 border border-[#FF4068] flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#FF4068]" />
                </div>
                <h2 className="font-display font-black text-3xl tracking-tighter">
                  sovereign_auth
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-current/5 transition-colors duration-300 group"
              >
                <X className="w-6 h-6 opacity-40 group-hover:text-[#FF4068] transition-colors duration-300" />
              </button>
            </div>

            <div className="flex-1">
              {!user ? (
                <div className="space-y-8">
                  <p className="font-mono text-xs opacity-40 leading-relaxed tracking-widest">
                    restricted access node. authentication via google required to establish administrative uplink.
                  </p>
                  
                  <TechButton 
                    onClick={handleLogin}
                    width="w-full"
                    height="h-16"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'processing...' : 'authenticate_via_google'}
                  </TechButton>
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="p-6 border border-current/10 bg-current/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 font-mono text-[8px] text-[#E6C03B] tracking-widest">active_session</div>
                    <div className="flex items-center gap-4 mb-4">
                      {user.user_metadata.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="" className="w-12 h-12 rounded-none border border-current/10" />
                      ) : (
                        <div className="w-12 h-12 bg-current/5 border border-current/10 flex items-center justify-center font-mono opacity-20">
                          {user.email?.[0].toLowerCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-display font-bold text-lg tracking-tight truncate max-w-[200px]">
                          {user.user_metadata.full_name?.toLowerCase() || user.email?.toLowerCase()}
                        </div>
                        <div className="font-mono text-[9px] opacity-30 tracking-widest">
                          {isAdmin ? 'clearance: level_admin' : 'clearance: level_user'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {isAdmin && (
                      <Link to="/admin" onClick={onClose} className="block group">
                        <div className="p-6 border border-current/10 bg-current/5 hover:bg-[#FF4068]/10 hover:border-[#FF4068]/30 transition-all duration-500 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <LayoutDashboard className="w-5 h-5 text-[#FF4068]" />
                            <span className="font-mono text-xs font-bold tracking-widest">command_center</span>
                          </div>
                          <div className="w-2 h-2 bg-[#FF4068]" />
                        </div>
                      </Link>
                    )}

                    <button 
                      onClick={handleLogout} 
                      className="w-full group text-left"
                      disabled={isLoggingOut}
                    >
                      <div className="p-6 border border-current/10 bg-current/5 hover:bg-current/10 transition-all duration-500 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <LogOut className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
                          <span className="font-mono text-xs font-bold opacity-40 group-hover:opacity-100 tracking-widest transition-opacity duration-500">
                            {isLoggingOut ? 'terminating...' : 'terminate_session'}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-12 border-t border-current/5 font-mono text-[8px] opacity-10 tracking-[0.5em] text-center">
              build_42_omega // secure_uplink_established
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
