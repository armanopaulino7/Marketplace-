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
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles(email)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
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
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o Marketplace
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-[2.5rem] border border-stone-200 overflow-hidden shadow-sm">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300">
                  <Package className="h-24 w-24" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images?.slice(1, 5).map((img: string, i: number) => (
                <div key={i} className="aspect-square bg-white rounded-2xl border border-stone-200 overflow-hidden cursor-pointer hover:border-indigo-500 transition-all">
                  <img src={img} alt={`${product.name} ${i+2}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-widest">
                  {product.category}
                </span>
                <span className="px-3 py-1 bg-stone-100 text-stone-500 text-xs font-bold rounded-full uppercase tracking-widest">
                  {product.subcategory}
                </span>
              </div>
              <h1 className="text-4xl font-black text-stone-900 mb-2 leading-tight">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-4 w-4 fill-current" />)}
                  <span className="text-sm text-stone-400 font-bold ml-1">(4.9 • 128 avaliações)</span>
                </div>
                <div className="h-4 w-px bg-stone-200" />
                <div className="text-sm text-stone-500">Vendido por <span className="font-bold text-stone-900">{product.profiles?.email}</span></div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-stone-900">R$ {product.price.toLocaleString()}</span>
                <span className="text-stone-400 text-sm line-through">R$ {(product.price * 1.2).toLocaleString()}</span>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => navigate(`/checkout/${product.id}${ref ? `?ref=${ref}` : ''}`)}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3"
                >
                  <ShoppingBag className="h-6 w-6" />
                  Comprar Agora
                </button>
                <p className="text-center text-xs text-stone-400">Pagamento 100% seguro e processamento imediato.</p>
              </div>

              <div className="pt-6 border-t border-stone-100 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">Garantia de 7 dias</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">Acesso Imediato</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-stone-900">Sobre o Produto</h2>
              <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>

            {product.variations && (
              <div className="space-y-6">
                {Object.entries(product.variations).map(([key, values]: [string, any]) => (
                  values && values.length > 0 && (
                    <div key={key} className="space-y-3">
                      <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">{key}</h3>
                      <div className="flex flex-wrap gap-2">
                        {values.map((v: string, i: number) => (
                          <button key={i} className="px-4 py-2 border border-stone-200 rounded-xl text-sm font-bold text-stone-600 hover:border-indigo-500 hover:text-indigo-600 transition-all">
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
