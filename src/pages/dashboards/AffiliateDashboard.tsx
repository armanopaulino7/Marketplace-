import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { 
  Link as LinkIcon, 
  DollarSign, 
  Target, 
  Award, 
  Home as HomeIcon,
  User as UserIcon,
  Wallet,
  UserPlus,
  ArrowUpRight,
  ExternalLink,
  Copy,
  CheckCircle2,
  ShoppingBag,
  Clock,
  Package,
  AlertCircle,
  Camera
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import WalletCard from '../../components/WalletCard';
import ImageUpload from '../../components/ImageUpload';

export default function AffiliateDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [myAffiliations, setMyAffiliations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pendingCommission: 0,
    totalClicks: 0,
    level: 'Bronze'
  });

  const fetchStats = async () => {
    if (!user) return;
    try {
      // Fetch pending commissions
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      // For now, let's just use the wallet balance as commission
      // In a real app, we'd have a commissions table
      setStats({
        pendingCommission: wallet?.balance || 0,
        totalClicks: 0, // Need a clicks tracking table for this
        level: 'Bronze'
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAvailableProducts();
      fetchMyAffiliations();
      fetchStats();
    }
  }, [user, activeTab]);

  const fetchAvailableProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get all approved products
      const { data: products, error: pError } = await supabase
        .from('produtos')
        .select('*, profiles(email)')
        .eq('status', 'approved');

      if (pError) throw pError;

      // Get user's current affiliations
      const { data: affiliations, error: aError } = await supabase
        .from('affiliations')
        .select('product_id')
        .eq('affiliate_id', user.id);

      if (aError) throw aError;

      const affiliatedIds = new Set(affiliations?.map(a => a.product_id));
      
      // Filter products the user is NOT affiliated with
      setAvailableProducts(products?.filter(p => !affiliatedIds.has(p.id)) || []);
    } catch (err) {
      console.error('Error fetching available products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAffiliations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('affiliations')
        .select('*, produtos(*, profiles(email))')
        .eq('affiliate_id', user.id)
        .eq('status', 'approved');

      if (error) throw error;
      setMyAffiliations(data || []);
    } catch (err) {
      console.error('Error fetching my affiliations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAffiliateRequest = async (productId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('affiliations')
        .insert({
          product_id: productId,
          affiliate_id: user.id,
          status: 'approved' // Auto-approving for now as per simple flow
        });

      if (error) throw error;
      
      // Refresh lists
      fetchAvailableProducts();
      fetchMyAffiliations();
      setActiveTab('sou-afiliado');
    } catch (err) {
      console.error('Error requesting affiliation:', err);
      alert('Erro ao solicitar afiliação.');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getAffiliateLink = (productId: string, type: 'sales' | 'checkout') => {
    const baseUrl = window.location.origin;
    const path = type === 'sales' ? `/product/${productId}` : `/checkout/${productId}`;
    return `${baseUrl}${path}?ref=${user?.id}`;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Dashboard Afiliado</h1>
              <p className="text-stone-500 dark:text-stone-400">Promova produtos e acompanhe suas comissões.</p>
            </div>

            <WalletCard />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Comissão Pendente', value: `${stats.pendingCommission.toFixed(2)} Kz`, icon: DollarSign, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' },
                { label: 'Cliques Totais', value: stats.totalClicks.toString(), icon: Target, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
                { label: 'Nível de Afiliado', value: stats.level, icon: Award, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' },
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

            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm p-6">
              <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-6">Sugestões para Você</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableProducts.slice(0, 2).map((product) => (
                  <div key={product.id} className="p-5 border border-stone-100 dark:border-stone-800 rounded-3xl hover:border-indigo-200 dark:hover:border-indigo-900 transition-all group bg-stone-50/50 dark:bg-stone-800/20">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-14 w-14 bg-white dark:bg-stone-800 rounded-2xl shadow-sm flex items-center justify-center text-stone-400 dark:text-stone-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors overflow-hidden">
                        {product.imagens?.[0] ? (
                          <img src={product.imagens[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <LinkIcon className="h-7 w-7" />
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-stone-400 dark:text-stone-500 uppercase font-bold tracking-widest">Comissão</div>
                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{product.commission_rate}%</div>
                      </div>
                    </div>
                    <h3 className="font-bold text-stone-900 dark:text-white text-lg mb-1 line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 line-clamp-2">{product.description}</p>
                    <button 
                      onClick={() => setActiveTab('afiliar-me')}
                      className="w-full py-3 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-2xl font-bold group-hover:bg-indigo-600 group-hover:text-white group-hover:border-transparent transition-all flex items-center justify-center gap-2"
                    >
                      Ver Detalhes do Produto
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {availableProducts.length === 0 && (
                  <div className="col-span-2 py-8 text-center text-stone-400 dark:text-stone-500">
                    Nenhum produto novo disponível para afiliação.
                  </div>
                )}
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
              <h2 className="text-xl font-bold text-stone-900 dark:text-white">Mercado de Afiliação</h2>
              <p className="text-stone-500 dark:text-stone-400 max-w-md mx-auto">Explore todos os produtos disponíveis no marketplace para afiliação.</p>
              <button 
                onClick={() => setActiveTab('afiliar-me')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
              >
                Explorar Produtos
              </button>
            </div>
          </div>
        );
      case 'afiliar-me':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Afiliar-me</h1>
              <button 
                onClick={fetchAvailableProducts}
                className="p-2 text-stone-400 hover:text-indigo-600 transition-colors"
              >
                <Clock className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 border-4 border-indigo-100 dark:border-stone-800 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : availableProducts.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 p-12 rounded-3xl border border-stone-200 dark:border-stone-800 text-center space-y-4">
                <Package className="h-16 w-16 text-stone-100 dark:text-stone-800 mx-auto" />
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">Nenhum produto disponível</h2>
                <p className="text-stone-500 dark:text-stone-400">Você já se afiliou a todos os produtos disponíveis ou não há produtos aprovados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {availableProducts.map((product) => (
                  <div key={product.id} className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center gap-6">
                    <div className="h-24 w-24 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center overflow-hidden">
                      {product.imagens?.[0] ? (
                        <img src={product.imagens[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <ShoppingBag className="h-10 w-10 text-stone-300 dark:text-stone-600" />
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-bold text-stone-900 dark:text-white text-lg">{product.name}</h3>
                      <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">Produtor: {product.profiles?.email} • Preço: {product.price.toLocaleString()} Kz</p>
                      <div className="flex items-center justify-center sm:justify-start gap-4">
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Comissão: {product.commission_rate}%</div>
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Afiliação Aberta</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleAffiliateRequest(product.id)}
                      className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus className="h-5 w-5" />
                      Afiliar-se Agora
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'sou-afiliado':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Produtos que sou Afiliado</h1>
            
            {myAffiliations.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 p-12 rounded-3xl border border-stone-200 dark:border-stone-800 text-center space-y-4">
                <Target className="h-16 w-16 text-stone-100 dark:text-stone-800 mx-auto" />
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">Nenhuma afiliação ativa</h2>
                <p className="text-stone-500 dark:text-stone-400">Vá para a aba "Afiliar-me" para começar a promover produtos.</p>
                <button 
                  onClick={() => setActiveTab('afiliar-me')}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
                >
                  Ver Produtos Disponíveis
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myAffiliations.map((aff) => (
                  <div key={aff.id} className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 overflow-hidden">
                        {aff.produtos?.imagens?.[0] ? (
                          <img src={aff.produtos.imagens[0]} alt={aff.produtos.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <CheckCircle2 className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 dark:text-white line-clamp-1">{aff.produtos?.name}</h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400">Comissão: {aff.produtos?.commission_rate}%</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Link da Página de Vendas</label>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-stone-50 dark:bg-stone-800 px-3 py-2.5 rounded-xl border border-stone-100 dark:border-stone-700 text-[10px] text-stone-600 dark:text-stone-400 truncate font-mono">
                            {getAffiliateLink(aff.product_id, 'sales')}
                          </div>
                          <button 
                            onClick={() => handleCopy(getAffiliateLink(aff.product_id, 'sales'), `${aff.id}-sales`)}
                            className={cn(
                              "p-2.5 rounded-xl transition-all flex items-center justify-center",
                              copied === `${aff.id}-sales` ? "bg-emerald-500 text-white" : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
                            )}
                          >
                            {copied === `${aff.id}-sales` ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Link de Checkout Direto</label>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-stone-50 dark:bg-stone-800 px-3 py-2.5 rounded-xl border border-stone-100 dark:border-stone-700 text-[10px] text-stone-600 dark:text-stone-400 truncate font-mono">
                            {getAffiliateLink(aff.product_id, 'checkout')}
                          </div>
                          <button 
                            onClick={() => handleCopy(getAffiliateLink(aff.product_id, 'checkout'), `${aff.id}-checkout`)}
                            className={cn(
                              "p-2.5 rounded-xl transition-all flex items-center justify-center",
                              copied === `${aff.id}-checkout` ? "bg-emerald-500 text-white" : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
                            )}
                          >
                            {copied === `${aff.id}-checkout` ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <a 
                        href={getAffiliateLink(aff.product_id, 'sales')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 bg-stone-900 dark:bg-stone-700 text-white rounded-xl font-bold text-xs hover:bg-stone-800 dark:hover:bg-stone-600 transition-all flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Testar Link
                      </a>
                      <button className="flex-1 py-2.5 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-xl font-bold text-xs hover:bg-stone-50 dark:hover:bg-stone-800 transition-all">
                        Material de Apoio
                      </button>
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
      case 'perfil':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Seu Perfil</h1>
            <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 max-w-2xl">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-3xl font-bold text-orange-600 dark:text-orange-400 overflow-hidden border-4 border-white dark:border-stone-800 shadow-sm">
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
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full uppercase tracking-widest">Afiliado</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 p-4 border border-stone-200 dark:border-stone-800 rounded-2xl font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all">
                  <UserIcon className="h-5 w-5" />
                  Editar Dados
                </button>
                <button className="flex items-center justify-center gap-2 p-4 border border-stone-200 dark:border-stone-800 rounded-2xl font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all">
                  <Wallet className="h-5 w-5" />
                  Dados de Pagamento
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
