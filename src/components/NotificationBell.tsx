import React, { useEffect, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Bell, X, Check, ExternalLink, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const { permission, requestPermission, showNotification } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Real-time subscription
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user?.id)
      .eq('read', false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const wasUnread = notifications.find((n) => n.id === id)?.read === false;
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors relative"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-stone-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <h3 className="font-bold text-stone-900 dark:text-white">Notificações</h3>
              <div className="flex items-center gap-2">
                {permission === 'default' && (
                  <button
                    onClick={requestPermission}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    title="Ativar notificações no sistema"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                )}
                {permission === 'granted' && (
                  <button
                    onClick={() => {
                      const options: any = { 
                        body: 'Se você está vendo isso, as notificações estão funcionando corretamente!',
                        icon: 'https://picsum.photos/seed/marketplace/192/192',
                        vibrate: [200, 100, 200],
                        renotify: true,
                        tag: 'test'
                      };
                      showNotification('Teste de Notificação', options);
                    }}
                    className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Testar
                  </button>
                )}
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-stone-400" />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-stone-400">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nenhuma notificação por aqui.</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-50 dark:divide-stone-800/50">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "p-4 transition-colors group relative",
                        !n.read ? "bg-indigo-50/30 dark:bg-indigo-900/10" : "hover:bg-stone-50 dark:hover:bg-stone-800/30"
                      )}
                    >
                      <div className="flex gap-3">
                        <div className={cn(
                          "h-2 w-2 rounded-full mt-1.5 flex-shrink-0",
                          !n.read ? "bg-indigo-600" : "bg-transparent"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-stone-900 dark:text-white leading-tight mb-1">
                            {n.title}
                          </p>
                          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-4 mb-2 whitespace-pre-wrap">
                            {n.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-stone-400">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!n.read && (
                                <button
                                  onClick={() => markAsRead(n.id)}
                                  className="p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                  title="Marcar como lida"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {n.link && (
                                <a
                                  href={n.link}
                                  className="p-1 text-stone-400 hover:text-indigo-600 transition-colors"
                                  title="Ver detalhes"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                              <button
                                onClick={() => deleteNotification(n.id)}
                                className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                                title="Excluir"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 text-center">
                <button className="text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors">
                  Ver todas as notificações
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
