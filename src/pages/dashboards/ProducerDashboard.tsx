import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { 
  Package, 
  TrendingUp, 
  Users, 
  Plus, 
  ClipboardList, 
  Wallet, 
  Home as HomeIcon,
  User as UserIcon,
  PlusCircle,
  ArrowUpRight,
  DollarSign,
  Image as ImageIcon,
  X,
  AlertCircle,
  CheckCircle2,
  Camera
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import WalletCard from '../../components/WalletCard';
import ImageUpload from '../../components/ImageUpload';

export default function ProducerDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    price: '',
    category: '',
    subcategory: '',
    commission_rate: '10',
    pickup_address: '',
    phone1: '',
    phone2: '',
    images: [] as string[],
    variations: {
      tamanho: [] as string[],
      peso: [] as string[],
      cor: [] as string[]
    }
  });

  const [newVariation, setNewVariation] = useState({ type: 'tamanho', value: '' });
  const [stats, setStats] = useState({
    activeProducts: 0,
    totalRevenue: 0,
    affiliates: 0
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentSales();
      fetchTopProducts();
    }
  }, [user, activeTab]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const { count: activeCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('producer_id', user.id)
        .eq('status', 'approved');

      const { data: orders } = await supabase
        .from('orders')
        .select('amount, commission_amount, delivery_fee')
        .eq('producer_id', user.id)
        .eq('status', 'completed');

      const revenue = orders?.reduce((acc, order) => {
        // Producer gets: amount - commission_amount - delivery_fee - 10% platform fee
        const productPrice = order.amount - (order.delivery_fee || 0);
        const platformFee = productPrice * 0.10;
        return acc + (productPrice - (order.commission_amount || 0) - platformFee);
      }, 0) || 0;

      const { count: affiliateCount } = await supabase
        .from('affiliations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .in('product_id', (await supabase.from('products').select('id').eq('producer_id', user.id)).data?.map(p => p.id) || []);

      setStats({
        activeProducts: activeCount || 0,
        totalRevenue: revenue,
        affiliates: affiliateCount || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchRecentSales = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, products(name)')
        .eq('producer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setRecentSales(data || []);
    } catch (err) {
      console.error('Error fetching recent sales:', err);
    }
  };

  const fetchTopProducts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('producer_id', user.id)
        .eq('status', 'approved')
        .order('price', { ascending: false }) // Just as a proxy for "top" for now
        .limit(3);
      
      if (error) throw error;
      setTopProducts(data || []);
    } catch (err) {
      console.error('Error fetching top products:', err);
    }
  };

  const handleAddVariation = () => {
    if (!newVariation.value) return;
    setFormData(prev => ({
      ...prev,
      variations: {
        ...prev.variations,
        [newVariation.type]: [...(prev.variations[newVariation.type as keyof typeof prev.variations]), newVariation.value]
      }
    }));
    setNewVariation({ ...newVariation, value: '' });
  };

  const removeVariation = (type: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      variations: {
        ...prev.variations,
        [type]: prev.variations[type as keyof typeof prev.variations].filter((_, i) => i !== index)
      }
    }));
  };

  const handleAddImage = (url: string) => {
    if (formData.images.length >= 5) return;
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, url]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (formData.images.length === 0) {
      setError('Adicione pelo menos uma imagem do produto.');
      return;
    }

    if (!formData.phone1) {
      setError('Pelo menos um número de telefone é obrigatório.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Submitting product with data:', {
        ...formData,
        producer_id: user.id
      });

      const { error: insertError } = await supabase
        .from('products')
        .insert({
          producer_id: user.id,
          name: formData.name,
          description: formData.description,
          quantity: parseInt(formData.quantity),
          price: parseFloat(formData.price),
          category: formData.category,
          subcategory: formData.subcategory,
          commission_rate: parseFloat(formData.commission_rate),
          pickup_address: formData.pickup_address,
          phone1: formData.phone1,
          phone2: formData.phone2,
          images: formData.images,
          variations: formData.variations,
          status: 'pending'
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setFormData({
        name: '',
        description: '',
        quantity: '',
        price: '',
        category: '',
        subcategory: '',
        commission_rate: '10',
        pickup_address: '',
        phone1: '',
        phone2: '',
        images: [],
        variations: { tamanho: [], peso: [], cor: [] }
      });
      
      setTimeout(() => {
        setSuccess(false);
        setActiveTab('dashboard');
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar produto.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Dashboard Produtor</h1>
                <p className="text-stone-500 dark:text-stone-400">Gerencie seus produtos e acompanhe suas vendas.</p>
              </div>
              <button 
                onClick={() => setActiveTab('cadastrar-produto')}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
              >
                <Plus className="h-5 w-5" />
                Novo Produto
              </button>
            </div>

            <WalletCard />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Produtos Ativos', value: stats.activeProducts.toString(), icon: Package, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
                { label: 'Receita Total', value: `${stats.totalRevenue.toLocaleString()} Kz`, icon: TrendingUp, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' },
                { label: 'Afiliados', value: stats.affiliates.toString(), icon: Users, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-stone-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-stone-500 dark:text-stone-400">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm p-6">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-4">Seus Produtos</h2>
                <div className="space-y-4">
                  {topProducts.length === 0 ? (
                    <div className="py-12 text-center text-stone-400">
                      Nenhum produto cadastrado.
                    </div>
                  ) : (
                    topProducts.map((product) => (
                      <div key={product.id} className="flex items-center gap-4 p-4 border border-stone-100 dark:border-stone-800 rounded-2xl hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all">
                        <div className="h-16 w-16 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-center justify-center overflow-hidden">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Package className="h-8 w-8 text-stone-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-stone-900 dark:text-white line-clamp-1">{product.name}</div>
                          <div className="text-sm text-stone-500 dark:text-stone-400">{product.price.toLocaleString()} Kz</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{product.quantity} em estoque</div>
                          <div className="text-xs text-stone-400 uppercase tracking-widest">{product.status}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm p-6">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-4">Solicitações de Afiliação</h2>
                <div className="space-y-4 text-center py-12">
                  <div className="bg-stone-50 dark:bg-stone-800 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-stone-300 dark:text-stone-600" />
                  </div>
                  <p className="text-stone-500 dark:text-stone-400 text-sm">Nenhuma solicitação pendente no momento.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'home':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Home</h1>
            <div className="bg-white dark:bg-stone-900 p-12 rounded-3xl border border-stone-200 dark:border-stone-800 text-center space-y-4">
              <HomeIcon className="h-16 w-16 text-stone-200 dark:text-stone-800 mx-auto" />
              <h2 className="text-xl font-bold text-stone-900 dark:text-white">Vitrine do Produtor</h2>
              <p className="text-stone-500 dark:text-stone-400 max-w-md mx-auto">Visualize como seus produtos aparecem para os clientes no marketplace.</p>
              <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all">Ver Minha Loja</button>
            </div>
          </div>
        );
      case 'cadastrar-produto':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Cadastrar Novo Produto</h1>
              <p className="text-stone-500 dark:text-stone-400">Preencha os detalhes abaixo para enviar seu produto para análise.</p>
            </div>

            {success && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 animate-in fade-in slide-in-from-top-4">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-bold">Produto enviado com sucesso! Aguarde a aprovação do ADM.</p>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-400">
                <AlertCircle className="h-5 w-5" />
                <p className="font-bold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
                  <h2 className="text-lg font-bold text-stone-900 dark:text-white border-b border-stone-100 dark:border-stone-800 pb-4">Informações Gerais</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Nome do Produto *</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="Ex: Camiseta Premium Algodão" 
                        className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Descrição Detalhada *</label>
                      <textarea 
                        required
                        rows={5} 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Descreva as características, benefícios e diferenciais do seu produto..." 
                        className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Categoria *</label>
                        <input 
                          required
                          type="text"
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                          placeholder="Ex: Moda"
                          className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Subcategoria *</label>
                        <input 
                          required
                          type="text"
                          value={formData.subcategory}
                          onChange={e => setFormData({...formData, subcategory: e.target.value})}
                          placeholder="Ex: Camisetas"
                          className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Endereço de Recolha (Pickup) *</label>
                      <input 
                        required
                        type="text" 
                        value={formData.pickup_address}
                        onChange={e => setFormData({...formData, pickup_address: e.target.value})}
                        placeholder="Ex: Rua Direita da Samba, Luanda (Seu endereço completo)" 
                        className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                      />
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 italic">Este endereço será usado pelo ADM para recolher o produto para entrega.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Telefone Principal *</label>
                        <input 
                          required
                          type="tel" 
                          value={formData.phone1}
                          onChange={e => setFormData({...formData, phone1: e.target.value})}
                          placeholder="Ex: 923 000 000" 
                          className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Telefone Secundário (Opcional)</label>
                        <input 
                          type="tel" 
                          value={formData.phone2}
                          onChange={e => setFormData({...formData, phone2: e.target.value})}
                          placeholder="Ex: 912 000 000" 
                          className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variations */}
                <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
                  <h2 className="text-lg font-bold text-stone-900 dark:text-white border-b border-stone-100 dark:border-stone-800 pb-4">Variações (Opcional)</h2>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select 
                      value={newVariation.type}
                      onChange={e => setNewVariation({...newVariation, type: e.target.value})}
                      className="px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 outline-none font-bold text-stone-700 dark:text-stone-300"
                    >
                      <option value="tamanho">Tamanho</option>
                      <option value="peso">Peso</option>
                      <option value="cor">Cor</option>
                    </select>
                    <div className="flex-1 flex gap-2">
                      <input 
                        type="text"
                        value={newVariation.value}
                        onChange={e => setNewVariation({...newVariation, value: e.target.value})}
                        placeholder="Ex: GG, 500g, Azul"
                        className="flex-1 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <button 
                        type="button"
                        onClick={handleAddVariation}
                        className="bg-stone-900 dark:bg-indigo-600 text-white px-6 rounded-2xl font-bold hover:bg-stone-800 dark:hover:bg-indigo-700 transition-all"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(formData.variations).map(([type, values]) => (values as string[]).length > 0 && (
                      <div key={type} className="space-y-2">
                        <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">{type}</p>
                        <div className="flex flex-wrap gap-2">
                          {(values as string[]).map((val, idx) => (
                            <span key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-sm font-bold">
                              {val}
                              <button type="button" onClick={() => removeVariation(type, idx)} className="text-stone-400 hover:text-rose-500">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
                  <h2 className="text-lg font-bold text-stone-900 dark:text-white border-b border-stone-100 dark:border-stone-800 pb-4">Preço e Estoque</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Preço de Venda (Kz) *</label>
                      <input 
                        required
                        type="number" 
                        step="0.01"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        placeholder="0,00" 
                        className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Quantidade em Estoque *</label>
                      <input 
                        required
                        type="number" 
                        value={formData.quantity}
                        onChange={e => setFormData({...formData, quantity: e.target.value})}
                        placeholder="0" 
                        className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Comissão Afiliado (%) *</label>
                      <div className="flex items-center gap-3">
                        <input 
                          required
                          type="range" 
                          min="0"
                          max="50"
                          value={formData.commission_rate}
                          onChange={e => setFormData({...formData, commission_rate: e.target.value})}
                          className="flex-1 h-2 bg-stone-100 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 min-w-[3rem] text-right">{formData.commission_rate}%</span>
                      </div>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 italic">Máximo permitido: 50%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
                  <h2 className="text-lg font-bold text-stone-900 dark:text-white border-b border-stone-100 dark:border-stone-800 pb-4">Imagens (1 a 5) *</h2>
                  
                  <ImageUpload 
                    onUpload={handleAddImage} 
                    folder="products"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {formData.images.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-800 group">
                        <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {formData.images.length === 0 && (
                      <div className="col-span-2 aspect-video rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center text-stone-400 dark:text-stone-600 gap-2">
                        <ImageIcon className="h-8 w-8" />
                        <p className="text-xs font-medium">Nenhuma imagem adicionada</p>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-6 w-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <PlusCircle className="h-6 w-6" />
                      Cadastrar Produto
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        );
      case 'pedidos':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Pedidos</h1>
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden">
              <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">Vendas Recentes</h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-xs font-bold rounded-full">Todos</span>
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">Pagos</span>
                </div>
              </div>
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {recentSales.length === 0 ? (
                  <div className="p-12 text-center text-stone-500 dark:text-stone-400">
                    Nenhuma venda registrada.
                  </div>
                ) : (
                  recentSales.map((sale) => (
                    <div key={sale.id} className="p-6 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <DollarSign className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 dark:text-white">Pedido #{sale.id.substring(0, 8).toUpperCase()}</div>
                          <div className="text-sm text-stone-500 dark:text-stone-400">{sale.products?.name} • {new Date(sale.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-stone-900 dark:text-white">{sale.amount.toLocaleString()} Kz</div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{sale.status}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      case 'carteira':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Sua Carteira</h1>
            <WalletCard />
          </div>
        );
      case 'perfil':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Perfil do Produtor</h1>
            <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 max-w-2xl">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-3xl font-bold text-emerald-600 dark:text-emerald-400 overflow-hidden border-4 border-white dark:border-stone-800 shadow-sm">
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
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full uppercase tracking-widest">Produtor</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-4 border border-stone-200 dark:border-stone-800 rounded-2xl font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all">
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-5 w-5 text-stone-400 dark:text-stone-500" />
                    Dados Cadastrais
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-stone-300 dark:text-stone-600" />
                </button>
                <button className="w-full flex items-center justify-between p-4 border border-stone-200 dark:border-stone-800 rounded-2xl font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all">
                  <Wallet className="h-5 w-5 text-stone-400 dark:text-stone-500" />
                  Dados Bancários
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
