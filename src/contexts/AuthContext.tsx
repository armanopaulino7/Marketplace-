import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  clearSession: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const updateLastSeen = async (userId: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating last_seen:', error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (user) {
      // Update immediately on login
      updateLastSeen(user.id);
      
      // Update every 2 minutes
      interval = setInterval(() => {
        updateLastSeen(user.id);
      }, 120000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user]);

  const clearSession = () => {
    console.warn('Clearing auth session manually...');
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    setUser(null);
    setProfile(null);
    window.location.reload();
  };

  useEffect(() => {
    // Check active sessions and sets the user
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error.message);
          
          // If session is invalid or refresh token not found, clear everything
          if (
            error.message.includes('Refresh Token Not Found') || 
            error.message.includes('invalid_refresh_token') ||
            error.message.includes('Refresh Token is invalid') ||
            error.message.includes('session_not_found')
          ) {
            await handleAuthError();
          } else {
            setLoading(false);
          }
          return;
        }
        
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Unexpected auth error:', err);
        setLoading(false);
      }
    };

    const handleAuthError = async () => {
      // Aggressively clear all localStorage items that might be related to supabase auth
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // Ignore sign out errors
      }
      
      setUser(null);
      setProfile(null);
      setLoading(false);
    };

    checkSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      } else if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        // Handle cases where session might be null but event isn't SIGNED_OUT
        if (event === 'INITIAL_SESSION' && !session) {
           setLoading(false);
        } else if (event === 'USER_UPDATED' && !session) {
           setUser(null);
           setProfile(null);
           setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, clearSession, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
