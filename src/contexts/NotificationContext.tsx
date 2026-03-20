import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Bell } from 'lucide-react';

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
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const dismissed = localStorage.getItem('notifications-prompt-dismissed');
    if (permission === 'default' && !dismissed) {
      setShowPrompt(true);
    }
  }, [permission]);

  useEffect(() => {
    if (!user) return;

    console.log('Subscribing to notifications for user:', user.id);

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
          console.log('New notification received from Supabase:', payload);
          const newNotif = payload.new;
          if (permission === 'granted') {
            showNotification(newNotif.title, {
              body: newNotif.message,
              icon: 'https://picsum.photos/seed/marketplace/192/192',
              badge: 'https://picsum.photos/seed/marketplace/192/192',
              tag: newNotif.id,
              data: { link: newNotif.link }
            });
          } else {
            console.warn('Notification received but permission is not granted:', permission);
          }
        }
      )
      .subscribe((status) => {
        console.log('Notification channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission]);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert('Seu navegador não suporta notificações.');
      return;
    }
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setShowPrompt(false);
      if (result === 'granted') {
        showNotification('Notificações Ativadas!', {
          body: 'Você agora receberá alertas de vendas e pedidos.',
          icon: 'https://picsum.photos/seed/marketplace/192/192'
        });
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  const dismissPrompt = () => {
    localStorage.setItem('notifications-prompt-dismissed', 'true');
    setShowPrompt(false);
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    console.log('Attempting to show notification:', title, options);
    if (typeof Notification !== 'undefined' && permission === 'granted') {
      try {
        // Try to use service worker registration for better background support
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          console.log('Using Service Worker to show notification');
          await registration.showNotification(title, options);
        } else {
          console.log('Falling back to standard Notification API');
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
      } catch (err) {
        console.error('Error showing notification:', err);
      }
    } else {
      console.warn('Cannot show notification: permission is', permission);
    }
  };

  return (
    <NotificationContext.Provider value={{ permission, requestPermission, showNotification }}>
      {showPrompt && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-indigo-100 dark:border-indigo-900/30 p-6 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-2xl shrink-0">
                <Bell className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-stone-900 dark:text-white text-lg">Ativar Notificações?</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                  Receba alertas de vendas, atualizações de pedidos e novidades diretamente no seu telefone ou computador.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={requestPermission}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
              >
                Ativar Agora
              </button>
              <button
                onClick={dismissPrompt}
                className="px-6 py-3 text-stone-500 dark:text-stone-400 font-bold text-sm hover:bg-stone-50 dark:hover:bg-stone-800 rounded-2xl transition-colors"
              >
                Depois
              </button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/20">
              <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-tight">
                <strong>Dica:</strong> Se estiver no iPhone, adicione este site à sua <strong>Tela de Início</strong> para receber notificações.
              </p>
            </div>
          </div>
        </div>
      )}
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
