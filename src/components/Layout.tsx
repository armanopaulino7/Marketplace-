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
  ClipboardList, 
  UserPlus, 
  Link as LinkIcon,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Sun, Moon } from 'lucide-react';

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
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getMenuItems = (): MenuItem[] => {
    switch (profile?.role) {
      case 'admin':
      case 'adm':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
          { id: 'home', label: 'Home', icon: Home },
          { id: 'financeiro', label: 'Aprovar Solicitação de Saque', icon: Wallet },
          { id: 'aprovacao-produtos', label: 'Aprovação de Produtos', icon: CheckSquare },
          { id: 'gestao-usuarios', label: 'Gestão de Usuários', icon: Users },
          { id: 'taxas-entrega', label: 'Taxas de Entrega', icon: Truck },
          { id: 'perfil', label: 'Perfil', icon: User },
        ];
      case 'producer':
      case 'produtor':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'home', label: 'Home', icon: Home },
          { id: 'cadastrar-produto', label: 'Cadastrar Produto', icon: PlusCircle },
          { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
          { id: 'afiliados', label: 'Afiliados', icon: Users },
          { id: 'carteira', label: 'Carteira', icon: Wallet },
          { id: 'perfil', label: 'Perfil', icon: User },
        ];
      case 'affiliate':
      case 'afiliado':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'home', label: 'Home', icon: Home },
          { id: 'afiliar-me', label: 'Afiliar-me', icon: UserPlus },
          { id: 'sou-afiliado', label: 'Sou Afiliado', icon: LinkIcon },
          { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
          { id: 'carteira', label: 'Carteira', icon: Wallet },
          { id: 'perfil', label: 'Perfil', icon: User },
        ];
      case 'customer':
      case 'cliente':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'home', label: 'Home', icon: Home },
          { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
          { id: 'perfil', label: 'Perfil', icon: User },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col md:flex-row transition-colors duration-300">
      {/* Mobile Header */}
      <header className="md:hidden bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 h-16 flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-indigo-600" />
          <span className="font-bold text-lg text-stone-900 dark:text-white">Marketplace</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
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
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-indigo-600" />
              <span className="font-bold text-xl text-stone-900 dark:text-white">Marketplace</span>
            </div>
            <button 
              onClick={toggleTheme}
              className="p-2 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl transition-colors"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
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
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
        <footer className="py-8 px-4 text-center text-stone-400 text-xs">
          &copy; {new Date().getFullYear()} Marketplace Multi-Role. Todos os direitos reservados.
        </footer>
      </main>
    </div>
  );
}
