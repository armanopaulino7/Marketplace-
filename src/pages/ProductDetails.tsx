import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  Star, 
  CheckCircle2,
  Package,
  AlertCircle
} from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const ref = searchParams.get('ref');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      // Try with join first
      const { data, error: fetchError } = await supabase
        .from('produtos')
        .select('*, profiles(email)')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.warn('Join with profiles failed, fetching without join:', fetchError);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('produtos')
          .select('*')
          .eq('id', id)
          .single();
        
        if (fallbackError) throw fallbackError;
        setProduct(fallbackData);
      } else {
        setProduct(data);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold text-stone-900">Produto não encontrado</h1>
        <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 font-bold hover:underline flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o CashLuanda
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
              {product.imagens?.[0] ? (
                <img src={product.imagens[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-700">
                  <Package className="h-24 w-24" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.imagens?.slice(1, 5).map((img: string, i: number) => (
                <div key={i} className="aspect-square bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden cursor-pointer hover:border-indigo-500 transition-all">
                  <img src={img} alt={`${product.name} ${i+2}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full uppercase tracking-widest">
                  {product.category}
                </span>
                <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-xs font-bold rounded-full uppercase tracking-widest">
                  {product.subcategory}
                </span>
              </div>
              <h1 className="text-4xl font-black text-stone-900 dark:text-white mb-2 leading-tight">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-4 w-4 fill-current" />)}
                  <span className="text-sm text-stone-400 dark:text-stone-500 font-bold ml-1">(4.9 • 128 avaliações)</span>
                </div>
                <div className="h-4 w-px bg-stone-200 dark:bg-stone-800" />
                <div className="text-sm text-stone-500 dark:text-stone-400">Vendido por <span className="font-bold text-stone-900 dark:text-white">{product.profiles?.email}</span></div>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 p-8 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-stone-900 dark:text-white">{product.price.toLocaleString()} Kz</span>
                <span className="text-stone-400 dark:text-stone-600 text-sm line-through">{(product.price * 1.2).toLocaleString()} Kz</span>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => navigate(`/checkout/${product.id}${ref ? `?ref=${ref}` : ''}`)}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-3"
                >
                  <ShoppingBag className="h-6 w-6" />
                  Comprar Agora
                </button>
                <p className="text-center text-xs text-stone-400 dark:text-stone-500">Pagamento 100% seguro e processamento imediato.</p>
              </div>

              <div className="pt-6 border-t border-stone-100 dark:border-stone-800 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">Garantia de 7 dias</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">Acesso Imediato</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-stone-900 dark:text-white">Sobre o Produto</h2>
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap text-base">{product.description}</p>
            </div>

            {product.variations && (
              <div className="space-y-6">
                {Object.entries(product.variations).map(([key, values]: [string, any]) => (
                  values && values.length > 0 && (
                    <div key={key} className="space-y-3">
                      <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-widest">{key}</h3>
                      <div className="flex flex-wrap gap-2">
                        {values.map((v: string, i: number) => (
                          <button key={i} className="px-4 py-2 border border-stone-200 dark:border-stone-800 rounded-xl text-sm font-bold text-stone-600 dark:text-stone-400 hover:border-indigo-500 hover:text-indigo-600 transition-all">
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
