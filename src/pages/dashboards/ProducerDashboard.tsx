import React, { useState } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function ProducerDashboard() {
  const { user } = useAuth();
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
    images: [] as string[],
    variations: {
      tamanho: [] as string[],
      peso: [] as string[],
      cor: [] as string[]
    }
  });

  const [newVariation, setNewVariation] = useState({ type: 'tamanho', value: '' });
  const [imageUrl, setImageUrl] = useState('');

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

  const handleAddImage = () => {
    if (!imageUrl || formData.images.length >= 5) return;
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrl]
    }));
    setImageUrl('');
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

    setLoading(true);
    setError(null);

    try {
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
                <h1 className="text-3xl font-bold text-stone-900">Dashboard Produtor</h1>
                <p className="text-stone-500">Gerencie seus produtos e acompanhe suas vendas.</p>
              </div>
              <button 
                onClick={() => setActiveTab('cadastrar-produto')}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Plus className="h-5 w-5" />
                Novo Produto
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Produtos Ativos', value: '12', icon: Package, color: 'bg-blue-50 text-blue-600' },
                { label: 'Receita Total', value: 'R$ 12.450', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
                { label: 'Afiliados', value: '48', icon: Users, color: 'bg-purple-50 text-purple-600' },
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-stone-900 mb-4">Seus Produtos Mais Vendidos</h2>
                <div className="space-y-4">
                  {[1, 2].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border border-stone-100 rounded-2xl hover:border-indigo-100 transition-all">
                      <div className="h-16 w-16 bg-stone-100 rounded-xl flex items-center justify-center">
                        <Package className="h-8 w-8 text-stone-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-stone-900">Curso de Marketing Digital {i+1}</div>
                        <div className="text-sm text-stone-500">R$ 197,00</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-600">24 vendas</div>
                        <div className="text-xs text-stone-400">Ativo</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-stone-900 mb-4">Solicitações de Afiliação</h2>
                <div className="space-y-4 text-center py-12">
                  <div className="bg-stone-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-stone-300" />
                  </div>
                  <p className="text-stone-500 text-sm">Nenhuma solicitação pendente no momento.</p>
                </div>
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
              <h2 className="text-xl font-bold text-stone-900">Vitrine do Produtor</h2>
              <p className="text-stone-500 max-w-md mx-auto">Visualize como seus produtos aparecem para os clientes no marketplace.</p>
              <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all">Ver Minha Loja</button>
            </div>
          </div>
        );
      case 'cadastrar-produto':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-stone-900">Cadastrar Novo Produto</h1>
              <p className="text-stone-500">Preencha os detalhes abaixo para enviar seu produto para análise.</p>
            </div>

            {success && (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 animate-in fade-in slide-in-from-top-4">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-bold">Produto enviado com sucesso! Aguarde a aprovação do ADM.</p>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-700">
                <AlertCircle className="h-5 w-5" />
                <p className="font-bold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
                  <h2 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-4">Informações Gerais</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Nome do Produto *</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="Ex: Camiseta Premium Algodão" 
                        className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Descrição Detalhada *</label>
                      <textarea 
                        required
                        rows={5} 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Descreva as características, benefícios e diferenciais do seu produto..." 
                        className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">Categoria *</label>
                        <input 
                          required
                          type="text"
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                          placeholder="Ex: Moda"
                          className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">Subcategoria *</label>
                        <input 
                          required
                          type="text"
                          value={formData.subcategory}
                          onChange={e => setFormData({...formData, subcategory: e.target.value})}
                          placeholder="Ex: Camisetas"
                          className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variations */}
                <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
                  <h2 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-4">Variações (Opcional)</h2>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select 
                      value={newVariation.type}
                      onChange={e => setNewVariation({...newVariation, type: e.target.value})}
                      className="px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50 outline-none font-bold text-stone-700"
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
                        className="flex-1 px-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <button 
                        type="button"
                        onClick={handleAddVariation}
                        className="bg-stone-900 text-white px-6 rounded-2xl font-bold hover:bg-stone-800 transition-all"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(formData.variations).map(([type, values]) => (values as string[]).length > 0 && (
                      <div key={type} className="space-y-2">
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{type}</p>
                        <div className="flex flex-wrap gap-2">
                          {(values as string[]).map((val, idx) => (
                            <span key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 text-stone-700 rounded-xl text-sm font-bold">
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
                <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
                  <h2 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-4">Preço e Estoque</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Preço de Venda (R$) *</label>
                      <input 
                        required
                        type="number" 
                        step="0.01"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        placeholder="0,00" 
                        className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Quantidade em Estoque *</label>
                      <input 
                        required
                        type="number" 
                        value={formData.quantity}
                        onChange={e => setFormData({...formData, quantity: e.target.value})}
                        placeholder="0" 
                        className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Comissão Afiliado (%) *</label>
                      <div className="flex items-center gap-3">
                        <input 
                          required
                          type="range" 
                          min="0"
                          max="50"
                          value={formData.commission_rate}
                          onChange={e => setFormData({...formData, commission_rate: e.target.value})}
                          className="flex-1 h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <span className="font-bold text-indigo-600 min-w-[3rem] text-right">{formData.commission_rate}%</span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1 italic">Máximo permitido: 50%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
                  <h2 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-4">Imagens (1 a 5) *</h2>
                  
                  <div className="flex gap-2">
                    <input 
                      type="url"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="URL da Imagem"
                      className="flex-1 px-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                    <button 
                      type="button"
                      onClick={handleAddImage}
                      disabled={formData.images.length >= 5}
                      className="p-3 bg-stone-100 text-stone-600 rounded-2xl hover:bg-stone-200 transition-all disabled:opacity-50"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {formData.images.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-stone-100 group">
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
                      <div className="col-span-2 aspect-video rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 gap-2">
                        <ImageIcon className="h-8 w-8" />
                        <p className="text-xs font-medium">Nenhuma imagem adicionada</p>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50"
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
            <h1 className="text-3xl font-bold text-stone-900">Pedidos</h1>
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden">
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-stone-900">Vendas Recentes</h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-stone-100 text-stone-500 text-xs font-bold rounded-full">Todos</span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full">Pagos</span>
                </div>
              </div>
              <div className="divide-y divide-stone-100">
                {[1, 2, 3, 4].map((_, i) => (
                  <div key={i} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <DollarSign className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-bold text-stone-900">Pedido #ORD-{1000 + i}</div>
                        <div className="text-sm text-stone-500">Cliente: maria@email.com • Há {i + 1}h</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-stone-900">R$ 197,00</div>
                      <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Aprovado</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'carteira':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Sua Carteira</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-stone-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-stone-400 text-sm font-medium mb-1">Saldo Disponível para Saque</p>
                  <h2 className="text-4xl font-black">R$ 8.450,00</h2>
                  <button className="mt-8 bg-white text-stone-900 px-6 py-3 rounded-2xl font-bold hover:bg-stone-100 transition-all">Solicitar Saque</button>
                </div>
                <Wallet className="absolute -right-8 -bottom-8 h-48 w-48 text-white/5 rotate-12" />
              </div>
              <div className="bg-white p-8 rounded-3xl border border-stone-200">
                <h3 className="text-lg font-bold text-stone-900 mb-6">Histórico de Saques</h3>
                <div className="space-y-4">
                  {[1, 2].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                      <div>
                        <div className="font-bold text-stone-900">R$ 2.000,00</div>
                        <div className="text-xs text-stone-500">15/02/2024 • Transferência Bancária</div>
                      </div>
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-lg">Concluído</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'perfil':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Perfil do Produtor</h1>
            <div className="bg-white p-8 rounded-3xl border border-stone-200 max-w-2xl">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center text-3xl font-bold text-emerald-600">
                  P
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold text-stone-900">João Produtor</h2>
                  <p className="text-stone-500">joao@exemplo.com</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full uppercase tracking-widest">Verificado</span>
                    <span className="px-3 py-1 bg-stone-100 text-stone-500 text-xs font-bold rounded-full uppercase tracking-widest">Nível 5</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-4 border border-stone-200 rounded-2xl font-bold text-stone-700 hover:bg-stone-50 transition-all">
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-5 w-5 text-stone-400" />
                    Dados Cadastrais
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-stone-300" />
                </button>
                <button className="w-full flex items-center justify-between p-4 border border-stone-200 rounded-2xl font-bold text-stone-700 hover:bg-stone-50 transition-all">
                  <Wallet className="h-5 w-5 text-stone-400" />
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
