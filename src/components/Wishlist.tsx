import React, { useEffect, useState } from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface WishlistItem {
  id: string;
  product_id: string;
  produtos: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    category: string;
  };
}

export function Wishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('wishlist')
      .select('*, produtos(*)')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (data) setItems(data);
    setIsLoading(false);
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from('wishlist').delete().eq('id', id);
    if (!error) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-500 fill-current" />
            Meus Favoritos
          </h2>
          <p className="text-sm text-stone-500">Produtos que você salvou para depois</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 bg-stone-100 dark:bg-stone-800 animate-pulse rounded-[2rem]" />
          ))
        ) : items.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white dark:bg-stone-900 rounded-[2.5rem] border border-dashed border-stone-200 dark:border-stone-800">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-10 w-10 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">Sua lista está vazia</h3>
            <p className="text-stone-500 mb-8 max-w-xs mx-auto">Explore nossa loja e salve os produtos que você mais gostar!</p>
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
            >
              Começar a Comprar
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="group bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-100 dark:border-stone-800 overflow-hidden transition-all hover:shadow-xl hover:shadow-stone-200/50 dark:hover:shadow-none">
              <div className="relative aspect-square overflow-hidden">
                <img 
                  src={item.produtos.image_url} 
                  alt={item.produtos.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="p-3 bg-white/90 backdrop-blur-md text-rose-600 rounded-xl shadow-lg hover:bg-rose-600 hover:text-white transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-stone-900 rounded-full">
                    {item.produtos.category}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {item.produtos.name}
                  </h3>
                  <p className="text-lg font-black text-stone-900 dark:text-white mt-1">
                    {item.produtos.price.toLocaleString()} KZ
                  </p>
                </div>

                <Link 
                  to={`/product/${item.product_id}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Ver Detalhes
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
