import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { 
  ShoppingBag, 
  Search, 
  ArrowRight, 
  Package, 
  Star,
  ShoppingCart
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { Cart } from '../components/Cart';

export default function Marketplace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'home';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('status', 'approved')
        .gt('quantity', 0)
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

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    if (activeTab === 'cart') {
      return <Cart />;
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Marketplace</h1>
          <p className="text-stone-500">Encontre os melhores produtos em Luanda.</p>
        </div>

        <div className="bg-white dark:bg-stone-900 p-8 sm:p-12 rounded-3xl border border-stone-200 dark:border-stone-800 text-center space-y-6 shadow-sm">
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="O que você está procurando?" 
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['Moda', 'Eletrônicos', 'Casa', 'Beleza'].map((cat, i) => (
              <button 
                key={i} 
                onClick={() => setSearchTerm(cat)}
                className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer font-bold text-stone-900 dark:text-white text-sm"
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="pt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-stone-900 dark:text-white">Produtos em Destaque</h2>
              {loading && <div className="h-5 w-5 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center space-y-4">
                <Package className="h-12 w-12 text-stone-100 dark:text-stone-800 mx-auto" />
                <p className="text-stone-500">Nenhum produto encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all text-left group flex flex-col"
                  >
                    <div className="h-48 bg-stone-200 dark:bg-stone-800 relative cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
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
                      <div className="absolute bottom-3 left-3 flex gap-2">
                        <span className="px-2 py-1 bg-stone-900/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                          {product.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-stone-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1 cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                        {product.name}
                      </h3>
                      <p className="text-xs text-stone-500 line-clamp-2 mb-4 h-8">{product.description}</p>
                      
                      <div className="flex items-center gap-1 text-amber-400 mb-4">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-3 w-3 fill-current" />)}
                        <span className="text-[10px] text-stone-400 font-bold ml-1">(5.0)</span>
                      </div>

                      <div className="mt-auto flex gap-2">
                        <button 
                          onClick={() => navigate(`/product/${product.id}`)}
                          className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-2xl font-bold text-xs hover:bg-stone-200 dark:hover:bg-stone-700 transition-all flex items-center justify-center gap-2"
                        >
                          Detalhes
                        </button>
                        <button 
                          onClick={() => addToCart(product)}
                          className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-xs hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="h-3 w-3" />
                          Carrinho
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}
