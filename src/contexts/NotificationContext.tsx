import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  permission: NotificationPermission;
  requestPermission: () => Promise<void>;
  showNotification: (title: string, options?: NotificationOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (!user) return;

    // Listen for new notifications in Supabase
    const channel = supabase
      .channel(`system-notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new;
          if (permission === 'granted') {
            showNotification(newNotif.title, {
              body: newNotif.message,
              icon: '/icon-192x192.png', // We'll add this later or use a placeholder
              tag: newNotif.id,
              data: { link: newNotif.link }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission]);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (typeof Notification !== 'undefined' && permission === 'granted') {
      // Try to use service worker registration for better background support
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification(title, options);
      } else {
        // Fallback to standard Notification
        const notification = new Notification(title, options);
        notification.onclick = (event) => {
          event.preventDefault();
          if (options?.data?.link) {
            window.focus();
            window.location.href = options.data.link;
          }
          notification.close();
        };
      }
    }
  };

  return (
    <NotificationContext.Provider value={{ permission, requestPermission, showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
