import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isAdmin: false, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then((response) => {
        const session = response.data?.session;
        setUser(session?.user ?? null);
        if (session?.user) {
          checkAdminStatus(session.user).catch(err => {
            console.error("Initial admin check failed:", err);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Supabase session fetch failed:", err);
        setLoading(false);
      });

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          setUser(session?.user ?? null);
          if (session?.user) {
            await checkAdminStatus(session.user);
          } else {
            setIsAdmin(false);
            setLoading(false);
          }
        } catch (err) {
          console.error("Error in onAuthStateChange callback:", err);
          setLoading(false);
        }
      }
    );
    
    const subscription = data?.subscription;

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setIsAdmin(data.role === 'admin' || data.role === 'superadmin');
      } else {
        // User doesn't exist in the users table yet, create them
        const isDefaultAdmin = currentUser.email === 'jojidurde@gmail.com';
        const role = isDefaultAdmin ? 'admin' : 'user';

        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: currentUser.id,
              email: currentUser.email,
              role: role,
            }
          ]);

        if (insertError) {
          console.error("Error creating user record:", insertError);
        }
        setIsAdmin(isDefaultAdmin);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
