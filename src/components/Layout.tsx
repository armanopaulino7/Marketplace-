import React, { useState } from 'react';
import { 
  LogOut, 
  LayoutDashboard, 
  User, 
  ShoppingBag, 
  Home, 
  CheckSquare, 
  Users, 
  Wallet, 
  Clock, 
  Truck, 
  PlusCircle, 
  Package,
  ClipboardList, 
  UserPlus, 
  Link as LinkIcon,
  Menu,
  X,
  Sun,
  Moon,
  Heart,
  Trophy,
  Ticket,
  FileText,
  ShieldAlert,
  History,
  MessageSquare,
  ShoppingCart,
  LogIn
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { NotificationBell } from './NotificationBell';
import { useCart } from '../contexts/CartContext';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { user, profile, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getMenuItems = (): MenuItem[] => {
    if (!user) {
      return [
        { id: 'home', label: 'Marketplace', icon: Home },
        { id: 'cart', label: 'Carrinho', icon: ShoppingCart },
      ];
    }

    switch (profile?.role) {
      case 'admin':
      case 'adm':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
          { id: 'home', label: 'Home', icon: Home },
          { id: 'cart', label: 'Carrinho', icon: ShoppingCart },
          { id: 'financeiro', label: 'Aprovar Solicitação de Saque', icon: Wallet },
          { id: 'aprovacao-produtos', label: 'Aprovação de Produtos', icon: CheckSquare },
          { id: 'gestao-usuarios', label: 'Gestão de Usuários', icon: Users },
          { id: 'taxas-entrega', label: 'Taxas de Entrega', icon: Truck },
          { id: 'denuncias', label: 'Denúncias', icon: ShieldAlert },
          { id: 'auditoria', label: 'Auditoria', icon: History },
          { id: 'perfil', label: 'Perfil', icon: User },
        ];
      case 'producer':
      case 'produtor':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'home', label: 'Home', icon: Home },
          { id: 'cart', label: 'Carrinho', icon: ShoppingCart },
          { id: 'cadastrar-produto', label: 'Cadastrar Produto', icon: PlusCircle },
          { id: 'meus-produtos', label: 'Meus Produtos', icon: Package },
          { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
          { id: 'afiliados', label: 'Afiliados', icon: Users },
          { id: 'cupons', label: 'Cupons', icon: Ticket },
          { id: 'materiais', label: 'Materiais de Apoio', icon: FileText },
          { id: 'ranking', label: 'Ranking Afiliados', icon: Trophy },
          { id: 'mensagens', label: 'Mensagens', icon: MessageSquare },
          { id: 'carteira', label: 'Carteira', icon: Wallet },
          { id: 'perfil', label: 'Perfil', icon: User },
        ];
      case 'affiliate':
      case 'afiliado':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'home', label: 'Home', icon: Home },
          { id: 'cart', label: 'Carrinho', icon: ShoppingCart },
          { id: 'afiliar-me', label: 'Afiliar-me', icon: UserPlus },
          { id: 'sou-afiliado', label: 'Sou Afiliado', icon: LinkIcon },
          { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
          { id: 'materiais', label: 'Materiais de Apoio', icon: FileText },
          { id: 'ranking', label: 'Ranking', icon: Trophy },
          { id: 'mensagens', label: 'Mensagens', icon: MessageSquare },
          { id: 'carteira', label: 'Carteira', icon: Wallet },
          { id: 'perfil', label: 'Perfil', icon: User },
        ];
      case 'customer':
      case 'cliente':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'home', label: 'Home', icon: Home },
          { id: 'cart', label: 'Carrinho', icon: ShoppingCart },
          { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
          { id: 'favoritos', label: 'Favoritos', icon: Heart },
          { id: 'mensagens', label: 'Mensagens', icon: MessageSquare },
          { id: 'perfil', label: 'Perfil', icon: User },
        ];
      default:
        return [
          { id: 'home', label: 'Home', icon: Home },
          { id: 'cart', label: 'Carrinho', icon: ShoppingCart },
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col md:flex-row transition-colors duration-300">
      {/* Mobile Header */}
      <header className="md:hidden bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 h-16 flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <ShoppingBag className="h-6 w-6 text-indigo-600" />
          <span className="font-bold text-lg text-stone-900 dark:text-white">CashLuanda</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('cart')}
            className="p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
          <NotificationBell />
          <ThemeToggle className="relative z-50" />
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="h-16 hidden md:flex items-center justify-between px-6 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <ShoppingBag className="h-6 w-6 text-indigo-600" />
              <span className="font-bold text-xl text-stone-900 dark:text-white">CashLuanda</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setActiveTab('cart')}
                className="p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors relative"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
              <NotificationBell />
              <ThemeToggle />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all",
                  activeTab === item.id
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-100 dark:shadow-none"
                    : "text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5", activeTab === item.id ? "text-indigo-600" : "text-stone-400")} />
                {item.label}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-stone-100 dark:border-stone-800">
            {user ? (
              <>
                <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden border-2 border-white dark:border-stone-700 shadow-sm">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        profile?.email?.[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-900 dark:text-white truncate">{profile?.email}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">{profile?.role}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                >
                  <LogOut className="h-5 w-5" />
                  Sair da Conta
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all"
                >
                  <LogIn className="h-5 w-5" />
                  Entrar
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
                >
                  <UserPlus className="h-5 w-5" />
                  Criar Conta
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
        <footer className="py-8 px-4 text-center text-stone-400 text-xs">
          &copy; {new Date().getFullYear()} CashLuanda. Todos os direitos reservados.
        </footer>
      </main>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/244938243909"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center group"
        aria-label="Contact us on WhatsApp"
      >
        <svg 
          viewBox="0 0 24 24" 
          className="h-7 w-7 fill-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.658 1.435 5.624 1.435h.006c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
        <span className="absolute right-full mr-3 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
          Suporte WhatsApp
        </span>
      </a>
    </div>
  );
}
