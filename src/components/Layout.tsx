import React from 'react';
import { LogOut, LayoutDashboard, User, Settings, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-indigo-600" />
              <span className="font-bold text-xl tracking-tight text-stone-900">Marketplace</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-stone-900">{profile?.email}</span>
                <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
                  {profile?.role}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-stone-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-stone-500 text-sm">
          &copy; {new Date().getFullYear()} Marketplace Multi-Role. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
