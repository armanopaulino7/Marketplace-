import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings, 
  CheckSquare, 
  Wallet, 
  Clock, 
  Truck, 
  Home as HomeIcon,
  User as UserIcon,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  AlertCircle,
  CheckCircle2,
  Camera,
  Search,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import WalletCard from '../../components/WalletCard';
import { useAuth } from '../../contexts/AuthContext';
import ImageUpload from '../../components/ImageUpload';

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [deliveryFees, setDeliveryFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newFee, setNewFee] = useState({ neighborhood: '', fee: '' });
  const [editingFee, setEditingFee] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    users: 0,
    sales: 0,
    pendingWithdrawals: 0,
    pendingProducts: 0
  });

  useEffect(() => {
    if (user && (profile?.role === 'admin' || profile?.role === 'adm')) {
      if (activeTab === 'home') {
        fetchProducts();
      }
      if (activeTab === 'pedidos') {
        fetchOrders();
      }
      fetchStats();
      fetchPendingProducts();
      fetchPendingWithdrawals();
      fetchDeliveryFees();
      fetchUsers();
    }
  }, [user, profile, activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, produtos(name, imagens)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Erro ao atualizar status do pedido.');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const forbiddenTerms = ['carro', 'casa', 'terreno', 'apartamento', 'vivenda', 'veículo', 'automóvel'];
      const filtered = (data || []).filter(p => {
        const lowerName = (p.name || '').toLowerCase();
        const lowerDesc = (p.description || '').toLowerCase();
        const lowerCat = (p.category || '').toLowerCase();
        return !forbiddenTerms.some(term => lowerName.includes(term) || lowerDesc.includes(term) || lowerCat.includes(term));
      });
      
      setProducts(filtered);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: pendingProdCount } = await supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: pendingWithCount } = await supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      
      // Fetch total sales (platform fees + delivery fees)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('amount, delivery_fee');
      
      let totalSales = 0;
      if (!ordersError && orders) {
        // Platform fee is 10% of (total - delivery_fee)
        totalSales = orders.reduce((acc, order) => {
          const productPrice = order.amount - (order.delivery_fee || 0);
          const platformFee = productPrice * 0.10;
          return acc + platformFee + (order.delivery_fee || 0);
        }, 0);
      }
      
      setStats({
        users: usersCount || 0,
        sales: totalSales,
        pendingWithdrawals: pendingWithCount || 0,
        pendingProducts: pendingProdCount || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchPendingProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try with join first
      const { data, error: fetchError } = await supabase
        .from('produtos')
        .select('*, profiles(email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.warn('Join with profiles failed, fetching without join:', fetchError);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('produtos')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        setPendingProducts(fallbackData || []);
      } else {
        setPendingProducts(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching pending products:', err);
      setError(err.message || 'Erro ao carregar produtos pendentes.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*, profiles(email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Join with profiles failed for withdrawals, fetching without join:', error);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        setPendingWithdrawals(fallbackData || []);
      } else {
        setPendingWithdrawals(data || []);
      }
    } catch (err) {
      console.error('Error fetching pending withdrawals:', err);
    }
  };

  const fetchDeliveryFees = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_fees')
        .select('*')
        .order('neighborhood', { ascending: true });
      
      if (error) throw error;
      setDeliveryFees(data || []);
    } catch (err) {
      console.error('Error fetching delivery fees:', err);
    }
  };

  const handleAddDeliveryFee = async () => {
    if (!newFee.neighborhood || !newFee.fee) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('delivery_fees')
        .insert([{ 
          neighborhood: newFee.neighborhood.trim(), 
          fee: parseFloat(newFee.fee) 
        }]);

      if (error) {
        if (error.code === '23505') {
          alert('Este bairro já possui uma taxa cadastrada. Edite a taxa existente ou use outro nome.');
        } else {
          throw error;
        }
        return;
      }
      
      setNewFee({ neighborhood: '', fee: '' });
      await fetchDeliveryFees();
      alert('Taxa adicionada com sucesso!');
    } catch (err: any) {
      console.error('Error adding delivery fee:', err);
      alert('Erro ao adicionar taxa: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeliveryFee = async () => {
    if (!editingFee) return;

    try {
      const { error } = await supabase
        .from('delivery_fees')
        .update({ 
          neighborhood: editingFee.neighborhood, 
          fee: parseFloat(editingFee.fee) 
        })
        .eq('id', editingFee.id);

      if (error) throw error;
      
      setEditingFee(null);
      fetchDeliveryFees();
    } catch (err) {
      console.error('Error updating delivery fee:', err);
      alert('Erro ao atualizar taxa de entrega.');
    }
  };

  const handleDeleteDeliveryFee = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta taxa?')) return;

    try {
      const { error } = await supabase
        .from('delivery_fees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchDeliveryFees();
    } catch (err) {
      console.error('Error deleting delivery fee:', err);
      alert('Erro ao remover taxa de entrega.');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleProductAction = async (productId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('produtos')
        .update({ status })
        .eq('id', productId);

      if (error) throw error;
      
      setPendingProducts(prev => prev.filter(p => p.id !== productId));
      fetchStats();
    } catch (err) {
      console.error(`Error ${status} product:`, err);
      alert('Erro ao processar ação no produto.');
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, status: 'approved' | 'rejected') => {
    try {
      if (status === 'approved') {
        // Get withdrawal details
        const { data: withdrawal, error: fetchError } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .eq('id', withdrawalId)
          .single();
        
        if (fetchError) throw fetchError;

        // Get current wallet balance
        const { data: wallet, error: walletFetchError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', withdrawal.user_id)
          .single();
        
        if (walletFetchError) throw walletFetchError;

        if (wallet.balance < withdrawal.amount) {
          alert('Usuário não possui saldo suficiente para este saque.');
          return;
        }

        // Deduct from wallet
        const { error: walletUpdateError } = await supabase
          .from('wallets')
          .update({ balance: wallet.balance - withdrawal.amount })
          .eq('user_id', withdrawal.user_id);
        
        if (walletUpdateError) throw walletUpdateError;
      }

      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ status })
        .eq('id', withdrawalId);

      if (error) throw error;
      
      setPendingWithdrawals(prev => prev.filter(w => w.id !== withdrawalId));
      fetchStats();
    } catch (err) {
      console.error(`Error ${status} withdrawal:`, err);
      alert('Erro ao processar ação no saque.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Dashboard ADM</h1>
              <p className="text-stone-500 dark:text-stone-400">Visão geral do sistema e métricas principais.</p>
            </div>

            <WalletCard />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Usuários Totais', value: stats.users.toString(), icon: Users, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', trend: '+12%', trendUp: true },
                { label: 'Vendas Mensais', value: `${stats.sales.toLocaleString()} Kz`, icon: BarChart3, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', trend: '+8%', trendUp: true },
                { label: 'Saques Pendentes', value: stats.pendingWithdrawals.toString(), icon: Wallet, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400', trend: '-2%', trendUp: false },
                { label: 'Produtos Pendentes', value: stats.pendingProducts.toString(), icon: CheckSquare, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400', trend: '+5', trendUp: true },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${stat.trendUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                      {stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {stat.trend}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-stone-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-stone-500 dark:text-stone-400">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-stone-100 dark:border-stone-800">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">Atividade Recente do Sistema</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="py-12 text-center space-y-4">
                    <Clock className="h-12 w-12 text-stone-100 dark:text-stone-800 mx-auto" />
                    <p className="text-stone-500 dark:text-stone-400">Nenhuma atividade recente registrada.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'financeiro':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Gestão Financeira</h1>
              <p className="text-stone-500 dark:text-stone-400">Aprove ou rejeite solicitações de saque dos usuários.</p>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">Saques Pendentes</h2>
                <span className="px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-bold">
                  {pendingWithdrawals.length} solicitações
                </span>
              </div>
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {pendingWithdrawals.length === 0 ? (
                  <div className="p-12 text-center space-y-4">
                    <div className="h-16 w-16 bg-stone-50 dark:bg-stone-800 text-stone-300 dark:text-stone-600 rounded-full flex items-center justify-center mx-auto">
                      <Wallet className="h-8 w-8" />
                    </div>
                    <p className="text-stone-500 dark:text-stone-400">Nenhuma solicitação de saque pendente.</p>
                  </div>
                ) : (
                  pendingWithdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-stone-400 dark:text-stone-500">
                          <Wallet className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 dark:text-white">{withdrawal.amount.toLocaleString()} Kz</div>
                          <div className="text-xs text-stone-500 dark:text-stone-400">{withdrawal.profiles?.email} • {withdrawal.method}</div>
                          <div className="text-[10px] font-mono text-stone-400 dark:text-stone-500 mt-1">{withdrawal.details?.info}</div>
                          {withdrawal.details?.fee > 0 && (
                            <div className="mt-1 flex gap-2">
                              <span className="text-[10px] bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold">Taxa: {withdrawal.details.fee} Kz</span>
                              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">Líquido: {withdrawal.details.net_amount} Kz</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleWithdrawalAction(withdrawal.id, 'rejected')}
                          className="px-4 py-2 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all text-sm"
                        >
                          Rejeitar
                        </button>
                        <button 
                          onClick={() => handleWithdrawalAction(withdrawal.id, 'approved')}
                          className="px-6 py-2 bg-emerald-600 text-white font-bold hover:bg-emerald-700 rounded-xl transition-all text-sm flex items-center gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Aprovar Pagamento
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      case 'pedidos':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Gestão de Pedidos</h1>
              <p className="text-stone-500 dark:text-stone-400">Gerencie todos os pedidos realizados no sistema.</p>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
                      <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Pedido / Cliente</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Produto</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Valor</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Pagamento</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-stone-900 dark:text-white">#{order.id.substring(0, 8)}</div>
                          <div className="text-xs text-stone-500 dark:text-stone-400">{order.customer_name}</div>
                          <div className="text-[10px] text-stone-400">{order.customer_phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-stone-100 dark:bg-stone-800 overflow-hidden flex-shrink-0">
                              {order.produtos?.imagens?.[0] ? (
                                <img src={order.produtos.imagens[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="h-5 w-5 m-2.5 text-stone-300" />
                              )}
                            </div>
                            <span className="font-bold text-stone-900 dark:text-white text-sm">{order.produtos?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-stone-900 dark:text-white">{order.amount.toLocaleString()} Kz</div>
                          <div className="text-[10px] text-stone-500">Entrega: {order.delivery_fee?.toLocaleString()} Kz</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase">{order.payment_method}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            order.status === 'completed' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" :
                            order.status === 'cancelled' ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" :
                            "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                          )}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="text-xs bg-stone-100 dark:bg-stone-800 border-none rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                          >
                            <option value="pending">Pendente</option>
                            <option value="processing">Em Processamento</option>
                            <option value="completed">Concluído</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-stone-400 dark:text-stone-500">
                          Nenhum pedido realizado ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'home':
        const filteredProducts = products.filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Home</h1>
            <div className="bg-white dark:bg-stone-900 p-8 sm:p-12 rounded-3xl border border-stone-200 dark:border-stone-800 text-center space-y-6">
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar produtos no marketplace..." 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['Design', 'Marketing', 'Programação', 'Negócios'].map((cat, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSearchTerm(cat)}
                    className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 hover:border-indigo-200 transition-all cursor-pointer font-bold text-stone-900 dark:text-white text-sm"
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white">Produtos no Marketplace</h2>
                  {loading && <div className="h-5 w-5 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />}
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="py-12 text-center space-y-4">
                    <Package className="h-12 w-12 text-stone-100 dark:text-stone-800 mx-auto" />
                    <p className="text-stone-500 dark:text-stone-400">Nenhum produto encontrado.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <div 
                        key={product.id} 
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all text-left group cursor-pointer"
                      >
                        <div className="h-48 bg-stone-200 dark:bg-stone-800 relative">
                          {product.imagens?.[0] ? (
                            <img src={product.imagens[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <Package className="h-12 w-12" />
                            </div>
                          )}
                          <div className="absolute top-3 right-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-black text-indigo-600 shadow-sm">
                            {product.price.toLocaleString()} Kz
                          </div>
                          <div className="absolute bottom-3 left-3">
                            <span className="px-2 py-1 bg-stone-900/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                              {product.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-stone-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">{product.name}</h3>
                          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mb-4 h-8">{product.description}</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/product/${product.id}`);
                            }}
                            className="w-full py-3 bg-stone-900 dark:bg-stone-800 text-white rounded-2xl font-bold text-xs hover:bg-stone-800 dark:hover:bg-stone-700 transition-all flex items-center justify-center gap-2"
                          >
                            Ver Detalhes
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'aprovacao-produtos':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Aprovação de Produtos</h1>
              <button 
                onClick={fetchPendingProducts}
                className="p-2 text-stone-400 hover:text-indigo-600 transition-colors"
                title="Atualizar"
              >
                <Clock className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 p-4 rounded-2xl flex items-start gap-3 text-sm mb-4">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 border-4 border-indigo-100 dark:border-stone-800 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : pendingProducts.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 p-12 rounded-3xl border border-stone-200 dark:border-stone-800 text-center space-y-4">
                <Package className="h-16 w-16 text-stone-100 dark:text-stone-800 mx-auto" />
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">Tudo em dia!</h2>
                <p className="text-stone-500 dark:text-stone-400">Não há produtos pendentes de aprovação no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingProducts.map((product) => (
                  <div key={product.id} className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center gap-6">
                    <div className="h-24 w-24 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center overflow-hidden">
                      {product.imagens?.[0] ? (
                        <img src={product.imagens[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Package className="h-10 w-10 text-stone-300 dark:text-stone-600" />
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-bold text-stone-900 dark:text-white text-lg">{product.name}</h3>
                      <p className="text-sm text-stone-500 dark:text-stone-400">Produtor: {product.profiles?.email} • {product.price.toLocaleString()} Kz</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1 flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Pickup: {product.pickup_address}
                      </p>
                      <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                        <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase rounded-lg">{product.category}</span>
                        <span className="px-2 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[10px] font-bold uppercase rounded-lg">{product.subcategory}</span>
                        <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase rounded-lg">Comissão: {product.commission_rate}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => handleProductAction(product.id, 'approved')}
                        className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all"
                      >
                        Aprovar
                      </button>
                      <button 
                        onClick={() => handleProductAction(product.id, 'rejected')}
                        className="flex-1 sm:flex-none px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'gestao-usuarios':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Gestão de Usuários</h1>
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Usuário</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Perfil</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-stone-500 dark:text-stone-400">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-stone-900 dark:text-white">{u.email}</div>
                          <div className="text-xs text-stone-500 dark:text-stone-500">ID: {u.id.substring(0, 8)}...</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[10px] font-bold uppercase rounded-lg">{u.role}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-sm text-stone-600 dark:text-stone-400">Ativo</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline">Editar</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'carteira':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Carteira Administrativa</h1>
            <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 dark:shadow-none relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-indigo-100 text-sm font-medium mb-1">Saldo Total em Custódia</p>
                <h2 className="text-4xl font-black">1.245.850,00 Kz</h2>
                <div className="mt-6 flex gap-4">
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl flex-1">
                    <p className="text-[10px] uppercase font-bold text-indigo-200">Comissões ADM</p>
                    <p className="text-lg font-bold">84.200,00 Kz</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl flex-1">
                    <p className="text-[10px] uppercase font-bold text-indigo-200">Taxas de Processamento</p>
                    <p className="text-lg font-bold">12.450,00 Kz</p>
                  </div>
                </div>
              </div>
              <Wallet className="absolute -right-8 -bottom-8 h-48 w-48 text-white/5 rotate-12" />
            </div>
          </div>
        );
      case 'aprovacao-saque':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Solicitações de Saque</h1>
            <div className="space-y-4">
              {[1, 2].map((_, i) => (
                <div key={i} className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center gap-6">
                  <div className="h-14 w-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <Clock className="h-7 w-7" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h3 className="font-bold text-stone-900 dark:text-white">1.500,00 Kz</h3>
                      <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-[10px] font-bold rounded uppercase">Pendente</span>
                    </div>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Solicitado por: produtor@exemplo.com • Há 2 dias</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">Aprovar Saque</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'taxas-entrega':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Taxas de Entrega</h1>
                <p className="text-stone-500 dark:text-stone-400">Gerencie os valores de entrega por bairro.</p>
              </div>
              <button 
                onClick={fetchDeliveryFees}
                className="p-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-2xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
                title="Atualizar Lista"
              >
                <Clock className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-6">
                {editingFee ? 'Editar Taxa' : 'Adicionar Novo Bairro'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Bairro</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Talatona"
                    value={editingFee ? editingFee.neighborhood : newFee.neighborhood}
                    onChange={(e) => editingFee 
                      ? setEditingFee({...editingFee, neighborhood: e.target.value})
                      : setNewFee({...newFee, neighborhood: e.target.value})
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Taxa (Kz)</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 1500"
                    value={editingFee ? editingFee.fee : newFee.fee}
                    onChange={(e) => editingFee
                      ? setEditingFee({...editingFee, fee: e.target.value})
                      : setNewFee({...newFee, fee: e.target.value})
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
                <div className="sm:col-span-1 flex items-end gap-2">
                  {editingFee ? (
                    <>
                      <button 
                        onClick={handleUpdateDeliveryFee}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
                      >
                        Salvar
                      </button>
                      <button 
                        onClick={() => setEditingFee(null)}
                        className="flex-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 py-3 rounded-2xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={handleAddDeliveryFee}
                      className="w-full bg-stone-900 dark:bg-stone-700 text-white py-3 rounded-2xl font-bold hover:bg-stone-800 dark:hover:bg-stone-600 transition-all"
                    >
                      Adicionar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Bairro</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Taxa</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {deliveryFees.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-stone-500 dark:text-stone-400">
                        Nenhuma taxa de entrega cadastrada.
                      </td>
                    </tr>
                  ) : (
                    deliveryFees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-stone-900 dark:text-white">{fee.neighborhood}</td>
                        <td className="px-6 py-4 text-stone-600 dark:text-stone-400">{fee.fee.toLocaleString()} Kz</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setEditingFee({ ...fee, fee: fee.fee.toString() })}
                              className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline"
                            >
                              Editar
                            </button>
                            <button 
                              onClick={() => handleDeleteDeliveryFee(fee.id)}
                              className="text-rose-600 dark:text-rose-400 font-bold text-sm hover:underline"
                            >
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'perfil':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Seu Perfil</h1>
            <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 max-w-2xl">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-3xl font-bold text-indigo-600 dark:text-indigo-400 overflow-hidden border-4 border-white dark:border-stone-800 shadow-sm">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      profile?.email?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageUpload 
                      onUpload={async (url) => {
                        try {
                          // 1. Update Auth Metadata
                          const { error: authError } = await supabase.auth.updateUser({
                            data: { avatar_url: url }
                          });
                          if (authError) throw authError;

                          // 2. Update Profiles Table
                          const { error: profileError } = await supabase
                            .from('profiles')
                            .update({ avatar_url: url })
                            .eq('id', user.id);
                          if (profileError) throw profileError;

                          alert('Foto de perfil atualizada!');
                          window.location.reload();
                        } catch (err: any) {
                          console.error('Error updating profile photo:', err);
                          alert('Erro ao atualizar foto: ' + (err.message || 'Erro desconhecido'));
                        }
                      }}
                      folder="avatars"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-stone-800 p-1.5 rounded-full shadow-md border border-stone-100 dark:border-stone-700 text-stone-400 dark:text-stone-500">
                    <Camera className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white">{user?.email?.split('@')[0]}</h2>
                  <p className="text-stone-500 dark:text-stone-400">{user?.email}</p>
                  <span className="mt-2 inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full uppercase tracking-widest">Acesso Total</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 p-4 border border-stone-200 dark:border-stone-800 rounded-2xl font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all">
                  <Settings className="h-5 w-5" />
                  Configurações
                </button>
                <button className="flex items-center justify-center gap-2 p-4 border border-stone-200 dark:border-stone-800 rounded-2xl font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all">
                  <UserIcon className="h-5 w-5" />
                  Editar Dados
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}
