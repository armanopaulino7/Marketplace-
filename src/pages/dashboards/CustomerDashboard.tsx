import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { 
  ShoppingBag, 
  Heart, 
  Clock, 
  Star, 
  Home as HomeIcon,
  User as UserIcon,
  ClipboardList,
  Search,
  ArrowRight,
  PlayCircle,
  Package,
  Camera,
  LogOut
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ImageUpload from '../../components/ImageUpload';
import ChangePasswordForm from '../../components/ChangePasswordForm';

export default function CustomerDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    myPurchases: 0,
    favorites: 0,
    studyHours: '0h'
  });
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'home') {
        fetchProducts();
      }
      if (activeTab === 'dashboard' || activeTab === 'pedidos') {
        fetchMyOrders();
      }
      fetchStats();
    }
  }, [user, activeTab]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', user.id);
      
      setStats(prev => ({ ...prev, myPurchases: count || 0 }));

      // Generate purchase history for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const { data: historyData } = await supabase
        .from('orders')
        .select('amount, created_at')
        .eq('customer_id', user.id)
        .gte('created_at', last7Days[0]);

      const historyMap = (historyData || []).reduce((acc: any, order: any) => {
        const date = order.created_at.split('T')[0];
        acc[date] = (acc[date] || 0) + order.amount;
        return acc;
      }, {});

      const chartData = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' }),
        gastos: historyMap[date] || 0
      }));

      setPurchaseHistory(chartData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchMyOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, produtos(*)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMyOrders(data || []);
    } catch (err) {
      console.error('Error fetching my orders:', err);
    } finally {
      setLoading(false);
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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-stone-900">Olá, Cliente!</h1>
              <p className="text-stone-500">Acesse suas compras e gerencie seus favoritos.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-6">Histórico de Gastos (7 dias)</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={purchaseHistory}>
                      <defs>
                        <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickFormatter={(value) => `${value.toLocaleString()} Kz`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1c1917', 
                          border: 'none', 
                          borderRadius: '12px',
                          color: '#fff'
                        }}
                        itemStyle={{ color: '#818cf8' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="gastos" 
                        stroke="#4f46e5" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorGastos)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-6">Categorias Preferidas</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(
                      myOrders.reduce((acc: any, order: any) => {
                        const cat = order.produtos?.category || 'Outros';
                        acc[cat] = (acc[cat] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([name, total]) => ({ name, total }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1c1917', 
                          border: 'none', 
                          borderRadius: '12px',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Minhas Compras', value: stats.myPurchases.toString(), icon: ShoppingBag, color: 'bg-indigo-50 text-indigo-600' },
                { label: 'Favoritos', value: stats.favorites.toString(), icon: Heart, color: 'bg-rose-50 text-rose-600' },
                { label: 'Horas de Estudo', value: stats.studyHours, icon: Clock, color: 'bg-amber-50 text-amber-600' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-stone-900">{stat.value}</div>
                  <div className="text-sm text-stone-500">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-stone-900">Meus Produtos</h2>
                <button 
                  onClick={() => setActiveTab('pedidos')}
                  className="text-sm text-indigo-600 font-bold hover:underline"
                >
                  Ver todos
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myOrders.length === 0 ? (
                    <div className="col-span-2 py-12 text-center text-stone-400">
                      Você ainda não adquiriu nenhum produto.
                    </div>
                  ) : (
                    myOrders.slice(0, 2).map((order) => (
                      <div key={order.id} className="flex flex-col sm:flex-row gap-4 group cursor-pointer" onClick={() => navigate(`/product/${order.product_id}`)}>
                        <div className="h-32 w-full sm:w-48 bg-stone-200 rounded-2xl flex-shrink-0 overflow-hidden relative">
                          {order.produtos?.imagens?.[0] ? (
                            <img 
                              src={order.produtos.imagens[0]} 
                              alt={order.produtos.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <Package className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-between py-1">
                          <div>
                            <h3 className="font-bold text-stone-900 text-lg group-hover:text-indigo-600 transition-colors line-clamp-1">{order.produtos?.name}</h3>
                            <p className="text-sm text-stone-500 line-clamp-2">{order.produtos?.description}</p>
                          </div>
                          <div className="mt-4 flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/product/${order.product_id}`);
                              }}
                              className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
                            >
                              Acessar Produto
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'home':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Home</h1>
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-stone-200 text-center space-y-6">
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="O que você quer aprender hoje?" 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['Design', 'Marketing', 'Programação', 'Negócios'].map((cat, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSearchTerm(cat)}
                    className="p-4 bg-stone-50 rounded-2xl border border-stone-100 hover:border-indigo-200 transition-all cursor-pointer font-bold text-stone-900 text-sm"
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-stone-900">Produtos em Destaque</h2>
                  {loading && <div className="h-5 w-5 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />}
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="py-12 text-center space-y-4">
                    <Package className="h-12 w-12 text-stone-100 mx-auto" />
                    <p className="text-stone-500">Nenhum produto encontrado.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <div 
                        key={product.id} 
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="bg-white border border-stone-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all text-left group cursor-pointer"
                      >
                        <div className="h-48 bg-stone-200 relative">
                          {product.imagens?.[0] ? (
                            <img src={product.imagens[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <Package className="h-12 w-12" />
                            </div>
                          )}
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-black text-indigo-600 shadow-sm">
                            {product.price.toLocaleString()} Kz
                          </div>
                          <div className="absolute bottom-3 left-3">
                            <span className="px-2 py-1 bg-stone-900/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                              {product.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-stone-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">{product.name}</h3>
                          <p className="text-xs text-stone-500 line-clamp-2 mb-4 h-8">{product.description}</p>
                          <div className="flex items-center gap-1 text-amber-400 mb-4">
                            {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-3 w-3 fill-current" />)}
                            <span className="text-[10px] text-stone-400 font-bold ml-1">(5.0)</span>
                          </div>
                          <button className="w-full py-3 bg-stone-900 text-white rounded-2xl font-bold text-xs hover:bg-stone-800 transition-all flex items-center justify-center gap-2">
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
      case 'pedidos':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Meus Pedidos</h1>
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden">
              <div className="divide-y divide-stone-100">
                {myOrders.length === 0 ? (
                  <div className="p-12 text-center text-stone-500">
                    Nenhum pedido realizado.
                  </div>
                ) : (
                  myOrders.map((order) => (
                    <div key={order.id} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-stone-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400 overflow-hidden">
                          {order.produtos?.imagens?.[0] ? (
                            <img src={order.produtos.imagens[0]} alt={order.produtos.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <ShoppingBag className="h-8 w-8" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900">Pedido #{order.id.substring(0, 8).toUpperCase()}</div>
                          <p className="text-sm text-stone-500">{order.produtos?.name} • {new Date(order.created_at).toLocaleDateString()}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase">{order.status}</span>
                            <span className="text-[10px] text-stone-400 font-bold">{order.amount.toLocaleString()} Kz</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate(`/product/${order.product_id}`)}
                        className="w-full sm:w-auto px-6 py-2.5 border border-stone-200 text-stone-700 rounded-xl font-bold text-sm hover:bg-stone-100 transition-all flex items-center justify-center gap-2"
                      >
                        Ver Detalhes
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      case 'perfil':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Seu Perfil</h1>
              <button 
                onClick={() => {
                  signOut();
                  navigate('/login');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-stone-200 max-w-2xl">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600 overflow-hidden border-4 border-white shadow-sm">
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
                  <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md border border-stone-100 text-stone-400">
                    <Camera className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold text-stone-900">{user?.email?.split('@')[0]}</h2>
                  <p className="text-stone-500">{user?.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-3 py-1 bg-stone-100 text-stone-500 text-xs font-bold rounded-full uppercase tracking-widest">Cliente</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <button 
                  onClick={() => alert('Funcionalidade de edição de dados em breve!')}
                  className="w-full flex items-center justify-between p-4 border border-stone-200 dark:border-stone-800 rounded-2xl font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-5 w-5 text-stone-400 dark:text-stone-500" />
                    Meus Dados
                  </div>
                  <ArrowRight className="h-4 w-4 text-stone-300 dark:text-stone-600" />
                </button>
                <button 
                  onClick={() => alert('Funcionalidade de avaliações em breve!')}
                  className="w-full flex items-center justify-between p-4 border border-stone-200 dark:border-stone-800 rounded-2xl font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-stone-400 dark:text-stone-500" />
                    Minhas Avaliações
                  </div>
                  <ArrowRight className="h-4 w-4 text-stone-300 dark:text-stone-600" />
                </button>
              </div>

              <div className="mt-8">
                <ChangePasswordForm />
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
