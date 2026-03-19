import React, { useEffect, useState, useRef } from 'react';
import { MessageSquare, Send, X, Search, User, Check, CheckCheck, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Contact {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

export function ChatSystem() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [allProfiles, setAllProfiles] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchContacts();
      fetchAllProfiles();
      const subscription = subscribeToMessages();
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchAllProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id)
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      if (data) {
        setAllProfiles(data.map(p => ({
          ...p,
          unread_count: 0
        })));
      }
    } catch (err) {
      console.error('Error fetching all profiles:', err);
    }
  };

  const startNewChat = (contact: Contact) => {
    // Check if contact already exists in contacts list
    const existing = contacts.find(c => c.id === contact.id);
    if (!existing) {
      setContacts(prev => [contact, ...prev]);
    }
    setSelectedContact(contact);
    setShowNewChatModal(false);
  };

  const filteredProfiles = allProfiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
      markAsRead(selectedContact.id);
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const subscribeToMessages = () => {
    return supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user?.id}`,
      }, (payload) => {
        const msg = payload.new as Message;
        if (selectedContact && msg.sender_id === selectedContact.id) {
          setMessages(prev => [...prev, msg]);
          markAsRead(msg.sender_id);
        }
        fetchContacts();
      })
      .subscribe();
  };

  const fetchContacts = async () => {
    setIsLoading(true);
    // This is a complex query to get unique contacts and their last message
    // For simplicity, we'll fetch profiles that have exchanged messages with the user
    const { data: sentMessages } = await supabase
      .from('messages')
      .select('receiver_id')
      .eq('sender_id', user?.id);
    
    const { data: receivedMessages } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', user?.id);
    
    const contactIds = Array.from(new Set([
      ...(sentMessages?.map(m => m.receiver_id) || []),
      ...(receivedMessages?.map(m => m.sender_id) || [])
    ]));

    if (contactIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', contactIds);
      
      if (profiles) {
        const contactsWithInfo = await Promise.all(profiles.map(async (p) => {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${p.id}),and(sender_id.eq.${p.id},receiver_id.eq.${user?.id})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          const { count: unread } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', p.id)
            .eq('receiver_id', user?.id)
            .eq('read', false);

          return {
            ...p,
            last_message: lastMsg?.content,
            last_message_time: lastMsg?.created_at,
            unread_count: unread || 0
          };
        }));

        setContacts(contactsWithInfo.sort((a, b) => 
          new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime()
        ));
      }
    }
    setIsLoading(false);
  };

  const fetchMessages = async (contactId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user?.id})`)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };

  const markAsRead = async (contactId: string) => {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', contactId)
      .eq('receiver_id', user?.id)
      .eq('read', false);
    
    setContacts(prev => prev.map(c => 
      c.id === contactId ? { ...c, unread_count: 0 } : c
    ));
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || isSending) return;

    setIsSending(true);
    const msg = {
      sender_id: user?.id,
      receiver_id: selectedContact.id,
      content: newMessage.trim()
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(msg)
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      alert('Erro ao enviar mensagem. Por favor, tente novamente.');
    } else if (data) {
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      fetchContacts();
    }
    setIsSending(false);
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden h-[700px] flex">
      {/* Sidebar: Contacts */}
      <div className="w-80 border-r border-stone-100 dark:border-stone-800 flex flex-col">
        <div className="p-6 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-stone-900 dark:text-white">Mensagens</h2>
            <button 
              onClick={() => setShowNewChatModal(true)}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
              title="Nova conversa"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Buscar conversas..."
              className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-xl py-3 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="p-6 flex items-center gap-4 animate-pulse">
                <div className="h-12 w-12 rounded-2xl bg-stone-100 dark:bg-stone-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-stone-100 dark:bg-stone-800 rounded" />
                  <div className="h-2 w-32 bg-stone-100 dark:bg-stone-800 rounded" />
                </div>
              </div>
            ))
          ) : contacts.length === 0 ? (
            <div className="p-12 text-center text-stone-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Nenhuma conversa ainda.</p>
            </div>
          ) : (
            contacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={cn(
                  "w-full p-6 flex items-center gap-4 transition-all hover:bg-stone-50 dark:hover:bg-stone-800/50 text-left relative group",
                  selectedContact?.id === contact.id && "bg-indigo-50 dark:bg-indigo-900/20"
                )}
              >
                <div className="relative">
                  <div className="h-12 w-12 rounded-2xl bg-stone-100 dark:bg-stone-800 overflow-hidden border-2 border-white dark:border-stone-700 shadow-sm">
                    {contact.avatar_url ? (
                      <img src={contact.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold">
                        {contact.full_name?.[0] || contact.email?.[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  {contact.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-stone-900">
                      {contact.unread_count}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-stone-900 dark:text-white text-sm truncate">
                      {contact.full_name || contact.email.split('@')[0]}
                    </p>
                    {contact.last_message_time && (
                      <span className="text-[10px] text-stone-400 font-bold">
                        {format(new Date(contact.last_message_time), 'HH:mm')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                    {contact.last_message || 'Inicie uma conversa...'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-stone-50/50 dark:bg-stone-800/20">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-6 bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  {selectedContact.avatar_url ? (
                    <img src={selectedContact.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold">
                      {selectedContact.full_name?.[0] || selectedContact.email?.[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-stone-900 dark:text-white text-sm">
                    {selectedContact.full_name || selectedContact.email.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {messages.map((msg, index) => {
                const isMine = msg.sender_id === user?.id;
                const showDate = index === 0 || 
                  format(new Date(msg.created_at), 'yyyy-MM-dd') !== 
                  format(new Date(messages[index-1].created_at), 'yyyy-MM-dd');

                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center">
                        <span className="px-4 py-1 bg-stone-100 dark:bg-stone-800 rounded-full text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                          {format(new Date(msg.created_at), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    )}
                    <div className={cn(
                      "flex",
                      isMine ? "justify-end" : "justify-start"
                    )}>
                      <div className={cn(
                        "max-w-[70%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm",
                        isMine 
                          ? "bg-indigo-600 text-white rounded-tr-none" 
                          : "bg-white dark:bg-stone-900 text-stone-900 dark:text-white rounded-tl-none border border-stone-100 dark:border-stone-800"
                      )}>
                        {msg.content}
                        <div className={cn(
                          "flex items-center gap-1 mt-1 text-[10px]",
                          isMine ? "text-indigo-200" : "text-stone-400"
                        )}>
                          {format(new Date(msg.created_at), 'HH:mm')}
                          {isMine && (
                            msg.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800">
              <form onSubmit={sendMessage} className="flex items-center gap-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2.5rem] flex items-center justify-center mb-8">
              <MessageSquare className="h-12 w-12 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-black text-stone-900 dark:text-white mb-2">Suas Mensagens</h3>
            <p className="text-stone-500 dark:text-stone-400 max-w-xs">
              Selecione uma conversa ao lado para começar a conversar com produtores, afiliados ou clientes.
            </p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-stone-900 dark:text-white">Nova Conversa</h3>
              <button 
                onClick={() => setShowNewChatModal(false)}
                className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 border-b border-stone-100 dark:border-stone-800">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nome ou email..."
                  className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-xl py-3 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filteredProfiles.length === 0 ? (
                <div className="p-12 text-center text-stone-400">
                  <p className="text-sm">Nenhum usuário encontrado.</p>
                </div>
              ) : (
                filteredProfiles.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => startNewChat(profile)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-2xl transition-all text-left"
                  >
                    <div className="h-10 w-10 rounded-xl bg-stone-100 dark:bg-stone-800 overflow-hidden border border-stone-200 dark:border-stone-700">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold text-xs">
                          {profile.full_name?.[0] || profile.email?.[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900 dark:text-white text-sm">
                        {profile.full_name || profile.email.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                        {(profile as any).role || 'Usuário'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
