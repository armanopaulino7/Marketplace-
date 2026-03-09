import React, { useState } from 'react';
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
  ShoppingBag
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AffiliateDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [copied, setCopied] = useState<number | null>(null);

  const handleCopy = (id: number) => {
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
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
                { label: 'Comissão Pendente', value: 'R$ 850,00', icon: DollarSign, color: 'bg-orange-50 text-orange-600' },
                { label: 'Cliques Totais', value: '1,420', icon: Target, color: 'bg-blue-50 text-blue-600' },
                { label: 'Nível de Afiliado', value: 'Prata', icon: Award, color: 'bg-indigo-50 text-indigo-600' },
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
              <h2 className="text-lg font-bold text-stone-900 mb-6">Produtos em Destaque</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((_, i) => (
                  <div key={i} className="p-5 border border-stone-100 rounded-3xl hover:border-indigo-200 transition-all group bg-stone-50/50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-14 w-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-stone-400 group-hover:text-indigo-600 transition-colors">
                        <LinkIcon className="h-7 w-7" />
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">Comissão</div>
                        <div className="text-xl font-black text-emerald-600">50%</div>
                      </div>
                    </div>
                    <h3 className="font-bold text-stone-900 text-lg mb-1">Ebook: Guia de Investimentos {i+1}</h3>
                    <p className="text-sm text-stone-500 mb-6 line-clamp-2">Aprenda a investir do zero com este guia completo e prático para iniciantes.</p>
                    <button 
                      onClick={() => setActiveTab('afiliar-me')}
                      className="w-full py-3 bg-white text-stone-700 border border-stone-200 rounded-2xl font-bold group-hover:bg-indigo-600 group-hover:text-white group-hover:border-transparent transition-all flex items-center justify-center gap-2"
                    >
                      Ver Detalhes do Produto
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                ))}
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
              <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all">Explorar Produtos</button>
            </div>
          </div>
        );
      case 'afiliar-me':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Afiliar-me</h1>
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-stone-200 flex flex-col sm:flex-row items-center gap-6">
                  <div className="h-24 w-24 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400">
                    <ShoppingBag className="h-10 w-10" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-bold text-stone-900 text-lg">Curso de Fotografia Profissional {i+1}</h3>
                    <p className="text-sm text-stone-500 mb-2">Produtor: foto@exemplo.com • Preço: R$ 297,00</p>
                    <div className="flex items-center justify-center sm:justify-start gap-4">
                      <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Comissão: R$ 148,50</div>
                      <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Afiliação Aberta</div>
                    </div>
                  </div>
                  <button className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Solicitar Afiliação
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'sou-afiliado':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900">Produtos que sou Afiliado</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-stone-200 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900">Curso de Gastronomia</h3>
                      <p className="text-xs text-stone-500">Afiliação aprovada em 10/01/2024</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Seu Link de Divulgação</label>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-stone-50 px-4 py-3 rounded-xl border border-stone-100 text-sm text-stone-600 truncate font-mono">
                        https://mktp.com/ref/user123_prod{i}
                      </div>
                      <button 
                        onClick={() => handleCopy(i)}
                        className={cn(
                          "p-3 rounded-xl transition-all flex items-center justify-center",
                          copied === i ? "bg-emerald-500 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                        )}
                      >
                        {copied === i ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button className="flex-1 py-2.5 bg-stone-900 text-white rounded-xl font-bold text-xs hover:bg-stone-800 transition-all flex items-center justify-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Página de Vendas
                    </button>
                    <button className="flex-1 py-2.5 border border-stone-200 text-stone-700 rounded-xl font-bold text-xs hover:bg-stone-50 transition-all">
                      Material de Apoio
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
