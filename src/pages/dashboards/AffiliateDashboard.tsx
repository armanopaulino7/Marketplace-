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
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function AffiliateDashboard() {
  const { user } = useAuth();
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

  useEffect(() => {
    if (user) {
      fetchAvailableProducts();
      fetchMyAffiliations();
    }
  }, [user, activeTab]);

  const fetchAvailableProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get all approved products
      const { data: products, error: pError } = await supabase
        .from('products')
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
        .select('*, products(*, profiles(email))')
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
              <h1 className="text-3xl font-bold text-stone-900">Dashboard Afiliado</h1>
              <p className="text-stone-500">Promova produtos e acompanhe suas comissões.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Comissão Pendente', value: `R$ ${stats.pendingCommission.toFixed(2)}`, icon: DollarSign, color: 'bg-orange-50 text-orange-600' },
                { label: 'Cliques Totais', value: stats.totalClicks.toString(), icon: Target, color: 'bg-blue-50 text-blue-600' },
                { label: 'Nível de Afiliado', value: stats.level, icon: Award, color: 'bg-indigo-50 text-indigo-600' },
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

            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-stone-900 mb-6">Sugestões para Você</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableProducts.slice(0, 2).map((product) => (
                  <div key={product.id} className="p-5 border border-stone-100 rounded-3xl hover:border-indigo-200 transition-all group bg-stone-50/50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-14 w-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-stone-400 group-hover:text-indigo-600 transition-colors overflow-hidden">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <LinkIcon className="h-7 w-7" />
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">Comissão</div>
                        <div className="text-xl font-black text-emerald-600">{product.commission_rate}%</div>
                      </div>
                    </div>
                    <h3 className="font-bold text-stone-900 text-lg mb-1 line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-stone-500 mb-6 line-clamp-2">{product.description}</p>
                    <button 
                      onClick={() => setActiveTab('afiliar-me')}
                      className="w-full py-3 bg-white text-stone-700 border border-stone-200 rounded-2xl font-bold group-hover:bg-indigo-600 group-hover:text-white group-hover:border-transparent transition-all flex items-center justify-center gap-2"
                    >
                      Ver Detalhes do Produto
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {availableProducts.length === 0 && (
                  <div className="col-span-2 py-8 text-center text-stone-400">
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
            <h1 className="text-3xl font-bold text-stone-900">Home</h1>
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-4">
              <HomeIcon className="h-16 w-16 text-stone-200 mx-auto" />
              <h2 className="text-xl font-bold text-stone-900">Mercado de Afiliação</h2>
              <p className="text-stone-500 max-w-md mx-auto">Explore todos os produtos disponíveis no marketplace para afiliação.</p>
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
              <h1 className="text-3xl font-bold text-stone-900">Afiliar-me</h1>
              <button 
                onClick={fetchAvailableProducts}
                className="p-2 text-stone-400 hover:text-indigo-600 transition-colors"
              >
                <Clock className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : availableProducts.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-4">
                <Package className="h-16 w-16 text-stone-100 mx-auto" />
                <h2 className="text-xl font-bold text-stone-900">Nenhum produto disponível</h2>
                <p className="text-stone-500">Você já se afiliou a todos os produtos disponíveis ou não há produtos aprovados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {availableProducts.map((product) => (
                  <div key={product.id} className="bg-white p-6 rounded-3xl border border-stone-200 flex flex-col sm:flex-row items-center gap-6">
                    <div className="h-24 w-24 bg-stone-100 rounded-2xl flex items-center justify-center overflow-hidden">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <ShoppingBag className="h-10 w-10 text-stone-300" />
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-bold text-stone-900 text-lg">{product.name}</h3>
                      <p className="text-sm text-stone-500 mb-2">Produtor: {product.profiles?.email} • Preço: R$ {product.price.toLocaleString()}</p>
                      <div className="flex items-center justify-center sm:justify-start gap-4">
                        <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Comissão: {product.commission_rate}%</div>
                        <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Afiliação Aberta</div>
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
            <h1 className="text-3xl font-bold text-stone-900">Produtos que sou Afiliado</h1>
            
            {myAffiliations.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-4">
                <Target className="h-16 w-16 text-stone-100 mx-auto" />
                <h2 className="text-xl font-bold text-stone-900">Nenhuma afiliação ativa</h2>
                <p className="text-stone-500">Vá para a aba "Afiliar-me" para começar a promover produtos.</p>
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
                  <div key={aff.id} className="bg-white p-6 rounded-3xl border border-stone-200 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 overflow-hidden">
                        {aff.products?.images?.[0] ? (
                          <img src={aff.products.images[0]} alt={aff.products.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <CheckCircle2 className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 line-clamp-1">{aff.products?.name}</h3>
                        <p className="text-xs text-stone-500">Comissão: {aff.products?.commission_rate}%</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Link da Página de Vendas</label>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-stone-50 px-3 py-2.5 rounded-xl border border-stone-100 text-[10px] text-stone-600 truncate font-mono">
                            {getAffiliateLink(aff.product_id, 'sales')}
                          </div>
                          <button 
                            onClick={() => handleCopy(getAffiliateLink(aff.product_id, 'sales'), `${aff.id}-sales`)}
                            className={cn(
                              "p-2.5 rounded-xl transition-all flex items-center justify-center",
                              copied === `${aff.id}-sales` ? "bg-emerald-500 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                            )}
                          >
                            {copied === `${aff.id}-sales` ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Link de Checkout Direto</label>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-stone-50 px-3 py-2.5 rounded-xl border border-stone-100 text-[10px] text-stone-600 truncate font-mono">
                            {getAffiliateLink(aff.product_id, 'checkout')}
                          </div>
                          <button 
                            onClick={() => handleCopy(getAffiliateLink(aff.product_id, 'checkout'), `${aff.id}-checkout`)}
                            className={cn(
                              "p-2.5 rounded-xl transition-all flex items-center justify-center",
                              copied === `${aff.id}-checkout` ? "bg-emerald-500 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
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
                        className="flex-1 py-2.5 bg-stone-900 text-white rounded-xl font-bold text-xs hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Testar Link
                      </a>
                      <button className="flex-1 py-2.5 border border-stone-200 text-stone-700 rounded-xl font-bold text-xs hover:bg-stone-50 transition-all">
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
            <h1 className="text-3xl font-bold text-stone-900">Sua Carteira</h1>
            <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-indigo-100 text-sm font-medium mb-1">Saldo de Comissões Disponível</p>
                <h2 className="text-4xl font-black">R$ 1.240,00</h2>
                <button className="mt-8 bg-white text-indigo-600 px-6 py-3 rounded-2xl font-bold hover:bg-stone-100 transition-all">Solicitar Saque</button>
              </div>
              <Wallet className="absolute -right-8 -bottom-8 h-48 w-48 text-white/5 rotate-12" />
            </div>
            <div className="bg-white p-6 rounded-3xl border border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-4">Últimas Comissões</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-stone-900">Comissão: Venda Ebook</div>
                        <div className="text-[10px] text-stone-500">Há {i + 2} dias</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-emerald-600">+ R$ 48,50</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'perfil':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Seu Perfil</h1>
            <div className="bg-white p-8 rounded-3xl border border-stone-200 max-w-2xl">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <div className="h-24 w-24 rounded-full bg-orange-100 flex items-center justify-center text-3xl font-bold text-orange-600">
                  A
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold text-stone-900">Ana Afiliada</h2>
                  <p className="text-stone-500">ana@exemplo.com</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-widest">Afiliado Prata</span>
                    <span className="px-3 py-1 bg-stone-100 text-stone-500 text-xs font-bold rounded-full uppercase tracking-widest">Top 100</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 p-4 border border-stone-200 rounded-2xl font-bold text-stone-700 hover:bg-stone-50 transition-all">
                  <UserIcon className="h-5 w-5" />
                  Editar Dados
                </button>
                <button className="flex items-center justify-center gap-2 p-4 border border-stone-200 rounded-2xl font-bold text-stone-700 hover:bg-stone-50 transition-all">
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
