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
  Camera,
  Search,
  ArrowRight,
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
import { createNotification } from '../../lib/notifications';
import { useAuth } from '../../contexts/AuthContext';
import WalletCard from '../../components/WalletCard';
import ImageUpload from '../../components/ImageUpload';
import ChangePasswordForm from '../../components/ChangePasswordForm';
import { CouponManager } from '../../components/CouponManager';
import { SupportMaterials } from '../../components/SupportMaterials';
import { AffiliateRanking } from '../../components/AffiliateRanking';
import { ChatSystem } from '../../components/ChatSystem';
import { cn } from '../../lib/utils';

export default function ProducerDashboard() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    phone2: profile?.phone2 || ''
  });
  const [bankForm, setBankForm] = useState({
    iban_private: profile?.iban_private || '',
    bank_name_private: profile?.bank_name_private || '',
    holder_name_private: profile?.holder_name_private || ''
  });
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    price: '',
    category: '',
    subcategory: '',
    brand: '',
    model: '',
    commission_rate: '10',
    pickup_address: '',
    phone1: '',
    phone2: '',
    condition: 'Novo',
    imagens: [] as string[],
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
  const [salesHistory, setSalesHistory] = useState<any[]>([]);

  const categoriesMap: Record<string, string[]> = {
    'Moda': ['Roupas', 'Calçados', 'Acessórios', 'Relógios', 'Malas e Mochilas'],
    'Eletrônicos': ['Celulares', 'Informática', 'Áudio e Vídeo', 'Games', 'Câmeras'],
    'Beleza': ['Maquiagem', 'Perfumaria', 'Cuidados com a Pele', 'Cabelos', 'Higiene Pessoal'],
    'Saúde': ['Suplementos', 'Bem-estar', 'Equipamentos Médicos', 'Vitaminas'],
    'Casa e Cozinha': ['Decoração', 'Utensílios', 'Móveis', 'Cama, Mesa e Banho', 'Eletrodomésticos'],
    'Esportes': ['Fitness', 'Ciclismo', 'Camping', 'Suplementos Esportivos', 'Vestuário Esportivo'],
    'Brinquedos': ['Educativos', 'Jogos', 'Bonecas', 'Carrinhos', 'Ar Livre'],
    'Livros': ['Literatura', 'Didáticos', 'Autoajuda', 'Infantil', 'Técnicos'],
    'Outros': ['Artesanato', 'Papelaria', 'Pet Shop', 'Ferramentas']
  };

  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [allMyProducts, setAllMyProducts] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'home') {
        fetchProducts();
      }
      if (activeTab === 'meus-produtos') {
        fetchAllMyProducts();
      }
      fetchStats();
      fetchRecentSales();
      fetchTopProducts();
      fetchAffiliates();
    }
  }, [user, activeTab]);

  const fetchAllMyProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('producer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAllMyProducts(data || []);
    } catch (err) {
      console.error('Error fetching all products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAffiliates = async () => {
    if (!user) return;
    try {
      const { data: myProducts } = await supabase
        .from('produtos')
        .select('id')
        .eq('producer_id', user.id);
      
      if (!myProducts || myProducts.length === 0) {
        setAffiliates([]);
        return;
      }

      const productIds = myProducts.map(p => p.id);

      // Try with join first
      const { data, error } = await supabase
        .from('affiliations')
        .select('*, profiles!affiliate_id(email, full_name, avatar_url), produtos(name)')
        .in('product_id', productIds)
        .eq('status', 'approved');

      if (error) {
        console.warn('Join failed in fetchAffiliates, fetching without join:', error);
        // Fallback: fetch affiliations and then fetch profiles manually
        const { data: affs, error: affError } = await supabase
          .from('affiliations')
          .select('*, produtos(name)')
          .in('product_id', productIds)
          .eq('status', 'approved');
        
        if (affError) throw affError;
        
        if (affs && affs.length > 0) {
          const affiliateIds = Array.from(new Set(affs.map(a => a.affiliate_id)));
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', affiliateIds);
          
          const combined = affs.map(a => ({
            ...a,
            profiles: profs?.find(p => p.id === a.affiliate_id)
          }));
          setAffiliates(combined);
        } else {
          setAffiliates([]);
        }
      } else {
        // Map profiles!affiliate_id to profiles for consistency if needed
        const mappedData = data?.map(item => ({
          ...item,
          profiles: item.profiles || (item as any).profiles_affiliate_id
        }));
        setAffiliates(mappedData || []);
      }
    } catch (err) {
      console.error('Error fetching affiliates:', err);
    }
  };

  useEffect(() => {
    if (profile) {
      setRegistrationForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        phone2: profile.phone2 || ''
      });
      setBankForm({
        iban_private: profile.iban_private || '',
        bank_name_private: profile.bank_name_private || '',
        holder_name_private: profile.holder_name_private || ''
      });
    }
  }, [profile]);

  const handleUpdateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(registrationForm)
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      setShowRegistrationModal(false);
    } catch (err: any) {
      console.error('Error updating registration:', err);
      alert('Erro ao atualizar dados: ' + err.message);
    }
  };

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(bankForm)
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      setShowBankModal(false);
    } catch (err: any) {
      console.error('Error updating bank data:', err);
      alert('Erro ao atualizar dados bancários: ' + err.message);
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
    if (!user) return;
    try {
      const { data: myProducts } = await supabase
        .from('produtos')
        .select('id')
        .eq('producer_id', user.id);
      
      const productIds = myProducts?.map(p => p.id) || [];

      const { data: salesData } = await supabase
        .from('orders')
        .select('amount')
        .eq('status', 'completed') // Changed from 'paid' to 'completed' as per current status flow
        .in('product_id', productIds);
      
      const totalSales = salesData?.reduce((sum, sale) => sum + sale.amount, 0) || 0;

      const { count: affiliateCount } = await supabase
        .from('affiliations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .in('product_id', productIds);

      setStats({
        activeProducts: productIds.length,
        totalRevenue: totalSales,
        affiliates: affiliateCount || 0
      });

      // Generate sales history for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const { data: historyData } = await supabase
        .from('orders')
        .select('amount, created_at')
        .eq('status', 'completed')
        .in('product_id', productIds)
        .gte('created_at', last7Days[0]);

      const historyMap = (historyData || []).reduce((acc: any, order: any) => {
        const date = order.created_at.split('T')[0];
        acc[date] = (acc[date] || 0) + order.amount;
        return acc;
      }, {});

      const chartData = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' }),
        vendas: historyMap[date] || 0
      }));

      setSalesHistory(chartData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const [pendingAffiliations, setPendingAffiliations] = useState<any[]>([]);

  const fetchPendingAffiliations = async () => {
    if (!user) return;
    try {
      const { data: myProducts } = await supabase
        .from('produtos')
        .select('id')
        .eq('producer_id', user.id);
      
      const productIds = myProducts?.map(p => p.id) || [];
      if (productIds.length === 0) {
        setPendingAffiliations([]);
        return;
      }

      const { data, error } = await supabase
        .from('affiliations')
        .select('*, profiles!affiliate_id(email), produtos(name)')
        .eq('status', 'pending')
        .in('product_id', productIds);

      if (error) {
        console.warn('Join failed in fetchPendingAffiliations, fetching without join:', error);
        const { data: affs, error: affError } = await supabase
          .from('affiliations')
          .select('*, produtos(name)')
          .eq('status', 'pending')
          .in('product_id', productIds);
        
        if (affError) throw affError;

        if (affs && affs.length > 0) {
          const affiliateIds = Array.from(new Set(affs.map(a => a.affiliate_id)));
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', affiliateIds);
          
          const combined = affs.map(a => ({
            ...a,
            profiles: profs?.find(p => p.id === a.affiliate_id)
          }));
          setPendingAffiliations(combined);
        } else {
          setPendingAffiliations([]);
        }
      } else {
        const mappedData = data?.map(item => ({
          ...item,
          profiles: item.profiles || (item as any).profiles_affiliate_id
        }));
        setPendingAffiliations(mappedData || []);
      }
    } catch (err) {
      console.error('Error fetching pending affiliations:', err);
    }
  };

  const handleAffiliationRequest = async (id: string, status: 'approved' | 'rejected') => {
    try {
      // Get affiliate_id and product_id to notify BEFORE update
      const { data: aff } = await supabase
        .from('affiliations')
        .select('affiliate_id, product_id, produtos(name)')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('affiliations')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      if (aff) {
        await createNotification(
          aff.affiliate_id,
          status === 'approved' ? 'Afiliação Aprovada!' : 'Afiliação Rejeitada',
          `Sua solicitação para o produto "${Array.isArray(aff.produtos) ? (aff.produtos as any)[0]?.name : (aff.produtos as any)?.name}" foi ${status === 'approved' ? 'aprovada' : 'rejeitada'}.`,
          'product',
          '/dashboard/afiliado'
        );
      }

      fetchPendingAffiliations();
      fetchAffiliates();
      fetchStats();
    } catch (err) {
      console.error('Error updating affiliation:', err);
    }
  };

  useEffect(() => {
    if (user && (activeTab === 'dashboard' || activeTab === 'afiliados')) {
      fetchPendingAffiliations();
    }
  }, [user, activeTab]);

  const fetchRecentSales = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, produtos(name)')
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
        .from('produtos')
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
    if (formData.imagens.length >= 10) return;
    setFormData(prev => ({
      ...prev,
      imagens: [...prev.imagens, url]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imagens: prev.imagens.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (formData.imagens.length === 0) {
      setError('Adicione pelo menos uma imagem do produto.');
      return;
    }

    if (!formData.phone1) {
      setError('Pelo menos um número de telefone é obrigatório.');
      return;
    }

    const forbiddenTerms = ['carro', 'casa', 'terreno', 'apartamento', 'vivenda', 'veículo', 'automóvel'];
    const lowerName = formData.name.toLowerCase();
    const lowerDesc = formData.description.toLowerCase();
    const lowerCat = formData.category.toLowerCase();

    if (forbiddenTerms.some(term => lowerName.includes(term) || lowerDesc.includes(term) || lowerCat.includes(term))) {
      setError('Desculpe, a venda de veículos (carros) e imóveis (casas, terrenos) não é permitida nesta plataforma.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingProduct) {
        const { error: updateError } = await supabase
          .from('produtos')
          .update({
            name: formData.name,
            description: formData.description,
            quantity: parseInt(formData.quantity),
            price: parseFloat(formData.price),
            category: formData.category,
            subcategory: formData.subcategory,
            brand: formData.brand,
            model: formData.model,
            commission_rate: parseFloat(formData.commission_rate),
            pickup_address: formData.pickup_address,
            phone1: formData.phone1,
            phone2: formData.phone2,
            condition: formData.condition,
            imagens: formData.imagens,
            variations: formData.variations,
            status: 'pending' // Re-submit for approval after edit
          })
          .eq('id', editingProduct);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('produtos')
          .insert({
            producer_id: user.id,
            name: formData.name,
            description: formData.description,
            quantity: parseInt(formData.quantity),
            price: parseFloat(formData.price),
            category: formData.category,
            subcategory: formData.subcategory,
            brand: formData.brand,
            model: formData.model,
            commission_rate: parseFloat(formData.commission_rate),
            pickup_address: formData.pickup_address,
            phone1: formData.phone1,
            phone2: formData.phone2,
            condition: formData.condition,
            imagens: formData.imagens,
            variations: formData.variations,
            status: 'pending'
          });

        if (insertError) throw insertError;
      }

      setSuccess(true);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        quantity: '',
        price: '',
        category: '',
        subcategory: '',
        brand: '',
        model: '',
        commission_rate: '10',
        pickup_address: '',
        phone1: '',
        phone2: '',
        condition: 'Novo',
        imagens: [],
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

  const handleEditProduct = (product: any) => {
    setFormData({
      name: product.name || '',
      description: product.description || '',
      quantity: product.quantity?.toString() || '',
      price: product.price?.toString() || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      brand: product.brand || '',
      model: product.model || '',
      commission_rate: product.commission_rate?.toString() || '10',
      pickup_address: product.pickup_address || '',
      phone1: product.phone1 || '',
      phone2: product.phone2 || '',
      condition: product.condition || 'Novo',
      imagens: product.imagens || [],
      variations: product.variations || { tamanho: [], peso: [], cor: [] }
    });
    setEditingProduct(product.id);
    setActiveTab('cadastrar-produto');
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
            </div>

            <WalletCard />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-6">Desempenho de Vendas (7 dias)</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesHistory}>
                      <defs>
                        <linearGradient id="colorVendasProd" x1="0" y1="0" x2="0" y2="1">
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
                        dataKey="vendas" 
                        stroke="#4f46e5" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorVendasProd)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-6">Top Produtos (Vendas)</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts.slice(0, 5).map(p => ({
                      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
                      total: p.price // Using price as a proxy if sales_count isn't available
                    }))}>
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
                          {product.imagens?.[0] ? (
                            <img src={product.imagens[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Package className="h-8 w-8 text-stone-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-stone-900 dark:text-white line-clamp-1">{product.name}</div>
                          <div className="text-sm text-stone-500 dark:text-stone-400">{product.price.toLocaleString()} Kz</div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{product.quantity} em estoque</div>
                          <div className="text-xs text-stone-400 uppercase tracking-widest mb-1">{product.status}</div>
                          <button 
                            onClick={() => handleEditProduct(product)}
                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm p-6">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-4">Solicitações de Afiliação</h2>
                <div className="space-y-4">
                  {pendingAffiliations.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-stone-900 dark:text-white truncate">{req.profiles?.email}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">Produto: <span className="font-bold">{req.produtos?.name}</span></p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button 
                          onClick={() => handleAffiliationRequest(req.id, 'approved')}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                          Aprovar
                        </button>
                        <button 
                          onClick={() => handleAffiliationRequest(req.id, 'rejected')}
                          className="px-3 py-1.5 bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-[10px] font-bold rounded-xl hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingAffiliations.length === 0 && (
                    <div className="text-center py-12">
                      <div className="bg-stone-50 dark:bg-stone-800 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-stone-300 dark:text-stone-600" />
                      </div>
                      <p className="text-stone-500 dark:text-stone-400 text-sm">Nenhuma solicitação pendente no momento.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'cupons':
        return <CouponManager />;
      case 'materiais':
        return <SupportMaterials mode="producer" />;
      case 'ranking':
        return <AffiliateRanking />;
      case 'mensagens':
        return <ChatSystem />;
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
                {['Moda', 'Eletrônicos', 'Casa', 'Beleza'].map((cat, i) => (
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
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white">Produtos no CashLuanda</h2>
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
      case 'cadastrar-produto':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-stone-900 dark:text-white">
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h1>
              <p className="text-stone-500 dark:text-stone-400">
                {editingProduct 
                  ? 'Atualize os detalhes do seu produto abaixo.' 
                  : 'Preencha os detalhes abaixo para enviar seu produto para análise.'}
              </p>
            </div>

            {success && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 animate-in fade-in slide-in-from-top-4">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-bold">
                  {editingProduct ? 'Produto atualizado com sucesso!' : 'Produto enviado com sucesso!'} Aguarde a aprovação do ADM.
                </p>
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
                        className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all min-h-[150px] placeholder:text-stone-400"
                      ></textarea>
                    </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Categoria *</label>
                          <select 
                            required
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value, subcategory: ''})}
                            className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          >
                            <option value="">Selecione uma categoria</option>
                            {Object.keys(categoriesMap).map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 italic">Proibido: Carros, Casas e Terrenos.</p>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Subcategoria *</label>
                          <select 
                            required
                            disabled={!formData.category}
                            value={formData.subcategory}
                            onChange={e => setFormData({...formData, subcategory: e.target.value})}
                            className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                          >
                            <option value="">Selecione uma subcategoria</option>
                            {formData.category && categoriesMap[formData.category]?.map(sub => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Marca (Opcional)</label>
                          <input 
                            type="text" 
                            value={formData.brand}
                            onChange={e => setFormData({...formData, brand: e.target.value})}
                            placeholder="Ex: Nike, Samsung, Apple" 
                            className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Modelo (Opcional)</label>
                          <input 
                            type="text" 
                            value={formData.model}
                            onChange={e => setFormData({...formData, model: e.target.value})}
                            placeholder="Ex: Air Max, Galaxy S21, iPhone 13" 
                            className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Condição do Produto *</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['Novo', 'Usado'].map((cond) => (
                              <button
                                key={cond}
                                type="button"
                                onClick={() => setFormData({...formData, condition: cond})}
                                className={`py-3 rounded-2xl font-bold text-sm transition-all border ${
                                  formData.condition === cond 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-indigo-200'
                                }`}
                              >
                                {cond}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Endereço de Recolha (Pickup) *</label>
                          <input 
                            required
                            type="text" 
                            value={formData.pickup_address}
                            onChange={e => setFormData({...formData, pickup_address: e.target.value})}
                            placeholder="Ex: Rua Direita da Samba, Luanda" 
                            className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                          />
                        </div>
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
                      <input 
                        required
                        type="number" 
                        min="0"
                        max="100"
                        value={formData.commission_rate}
                        onChange={e => setFormData({...formData, commission_rate: e.target.value})}
                        placeholder="Ex: 10"
                        className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                      />
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 italic">Máximo permitido: 100%</p>
                    </div>

                    {formData.price && (
                      <div className="mt-6 p-5 bg-stone-50 dark:bg-stone-800/50 rounded-3xl border border-stone-100 dark:border-stone-800 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <h3 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2">Resumo de Ganhos</h3>
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-500 dark:text-stone-400">Preço do Produto:</span>
                          <span className="font-bold text-stone-900 dark:text-white">{Number(formData.price).toLocaleString()} Kz</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-500 dark:text-stone-400">Taxa da Plataforma (10%):</span>
                          <span className="font-bold text-rose-500">-{ (Number(formData.price) * 0.1).toLocaleString() } Kz</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-500 dark:text-stone-400">Comissão Afiliado ({formData.commission_rate}%):</span>
                          <span className="font-bold text-rose-500">-{ (Number(formData.price) * (Number(formData.commission_rate) / 100)).toLocaleString() } Kz</span>
                        </div>
                        <div className="pt-3 border-t border-stone-200 dark:border-stone-700 flex justify-between items-center">
                          <span className="text-sm font-bold text-stone-900 dark:text-white">Você Receberá:</span>
                          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                            { (Number(formData.price) - (Number(formData.price) * 0.1) - (Number(formData.price) * (Number(formData.commission_rate) / 100))).toLocaleString() } Kz
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
                  <h2 className="text-lg font-bold text-stone-900 dark:text-white border-b border-stone-100 dark:border-stone-800 pb-4">Imagens (1 a 10) *</h2>
                  
                  <ImageUpload 
                    onUpload={handleAddImage} 
                    folder="produtos"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {formData.imagens.map((url, idx) => (
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
                    {formData.imagens.length === 0 && (
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
                      {editingProduct ? <TrendingUp className="h-6 w-6" /> : <PlusCircle className="h-6 w-6" />}
                      {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                    </>
                  )}
                </button>

                {editingProduct && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setFormData({
                        name: '',
                        description: '',
                        quantity: '',
                        price: '',
                        category: '',
                        subcategory: '',
                        brand: '',
                        model: '',
                        commission_rate: '10',
                        pickup_address: '',
                        phone1: '',
                        phone2: '',
                        condition: 'Novo',
                        imagens: [],
                        variations: { tamanho: [], peso: [], cor: [] }
                      });
                      setActiveTab('meus-produtos');
                    }}
                    className="w-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 py-4 rounded-3xl font-bold text-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
                  >
                    Cancelar Edição
                  </button>
                )}
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
                          <div className="text-sm text-stone-500 dark:text-stone-400">
                            {sale.produtos?.name} • Qtd: {sale.quantity || 1} • {new Date(sale.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-1">
                            {sale.neighborhood} • Entrega: {new Date(sale.delivery_date).toLocaleDateString()}
                          </div>
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
      case 'meus-produtos':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Meus Produtos</h1>
                <p className="text-stone-500 dark:text-stone-400">Gerencie e edite seus produtos cadastrados.</p>
              </div>
              <button 
                onClick={() => setActiveTab('cadastrar-produto')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
              >
                <PlusCircle className="h-5 w-5" />
                Novo Produto
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
              <input 
                type="text"
                placeholder="Buscar em meus produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : allMyProducts.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 p-12 rounded-3xl border border-stone-200 dark:border-stone-800 text-center space-y-4">
                <Package className="h-16 w-16 text-stone-100 dark:text-stone-800 mx-auto" />
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">Nenhum produto cadastrado</h2>
                <p className="text-stone-500 dark:text-stone-400">Você ainda não possui produtos em sua conta.</p>
                <button 
                  onClick={() => setActiveTab('cadastrar-produto')}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
                >
                  Cadastrar Primeiro Produto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allMyProducts
                  .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((product) => (
                  <div key={product.id} className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={product.imagens?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80'} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm backdrop-blur-md",
                          product.status === 'approved' ? "bg-emerald-500/90 text-white" :
                          product.status === 'rejected' ? "bg-rose-500/90 text-white" :
                          "bg-amber-500/90 text-white"
                        )}>
                          {product.status}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="font-bold text-stone-900 dark:text-white line-clamp-1">{product.name}</h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{product.category} • {product.subcategory}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-stone-900 dark:text-white">
                          {product.price.toLocaleString()} Kz
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400">
                          Estoque: <span className="font-bold text-stone-900 dark:text-white">{product.quantity}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditProduct(product)}
                          className="flex-1 py-3 bg-stone-900 dark:bg-stone-700 text-white rounded-2xl font-bold text-sm hover:bg-stone-800 dark:hover:bg-stone-600 transition-all flex items-center justify-center gap-2"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Editar
                        </button>
                        <button 
                          onClick={() => navigate(`/product/${product.id}`)}
                          className="p-3 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 rounded-2xl font-bold text-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
                        >
                          <ArrowUpRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'carteira':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Sua Carteira</h1>
            <WalletCard />
          </div>
        );
      case 'afiliados':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Seus Afiliados</h1>
              <p className="text-stone-500 dark:text-stone-400">Pessoas que estão vendendo seus produtos.</p>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
                      <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Afiliado</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Produto</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Comissão</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Data Afiliação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {affiliates.map((aff) => (
                      <tr key={aff.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden border border-stone-100 dark:border-stone-800">
                              {aff.profiles?.avatar_url ? (
                                <img src={aff.profiles.avatar_url} alt="Affiliate" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                (aff.profiles?.full_name || aff.profiles?.email || 'A').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-stone-900 dark:text-white text-sm">
                                {aff.profiles?.full_name || aff.profiles?.email?.split('@')[0] || 'Afiliado'}
                              </div>
                              <div className="text-[10px] text-stone-400">{aff.profiles?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">
                          {aff.produtos?.name}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          {aff.commission_rate}%
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-500 dark:text-stone-400">
                          {new Date(aff.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {affiliates.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-stone-400 dark:text-stone-500">
                          Você ainda não possui afiliados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'perfil':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Perfil do Produtor</h1>
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
                <button 
                  onClick={() => setShowRegistrationModal(true)}
                  className="w-full flex items-center justify-between p-4 border border-stone-200 dark:border-stone-800 rounded-2xl font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-5 w-5 text-stone-400 dark:text-stone-500" />
                    Dados Cadastrais
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-stone-300 dark:text-stone-600" />
                </button>
                <button 
                  onClick={() => setShowBankModal(true)}
                  className="w-full flex items-center justify-between p-4 border border-stone-200 dark:border-stone-800 rounded-2xl font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-stone-400 dark:text-stone-500" />
                    Dados Bancários
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-stone-300 dark:text-stone-600" />
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

      {/* Modal Dados Cadastrais */}
      {showRegistrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800">
            <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-stone-900 dark:text-white">Dados Cadastrais</h3>
              <button onClick={() => setShowRegistrationModal(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
                <X className="h-5 w-5 text-stone-400" />
              </button>
            </div>
            <form onSubmit={handleUpdateRegistration} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Nome Completo</label>
                <input
                  type="text"
                  value={registrationForm.full_name}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Telefone Principal</label>
                <input
                  type="tel"
                  value={registrationForm.phone}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Telefone Secundário (Opcional)</label>
                <input
                  type="tel"
                  value={registrationForm.phone2}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, phone2: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all mt-4"
              >
                Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dados Bancários */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800">
            <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-stone-900 dark:text-white">Dados Bancários</h3>
              <button onClick={() => setShowBankModal(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
                <X className="h-5 w-5 text-stone-400" />
              </button>
            </div>
            <form onSubmit={handleUpdateBank} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">IBAN</label>
                <input
                  type="text"
                  value={bankForm.iban_private}
                  onChange={(e) => setBankForm({ ...bankForm, iban_private: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="AO06..."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Nome do Banco</label>
                <input
                  type="text"
                  value={bankForm.bank_name_private}
                  onChange={(e) => setBankForm({ ...bankForm, bank_name_private: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="Ex: BFA, BAI, BCI"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Titular da Conta</label>
                <input
                  type="text"
                  value={bankForm.holder_name_private}
                  onChange={(e) => setBankForm({ ...bankForm, holder_name_private: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="Nome do titular"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all mt-4"
              >
                Salvar Dados Bancários
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
