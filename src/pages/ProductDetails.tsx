import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  Star, 
  CheckCircle2,
  Package,
  AlertCircle,
  Maximize2,
  Minus,
  Plus,
  MessageSquare,
  MapPin,
  UserCheck,
  Share2,
  Search,
  Menu,
  Home,
  ChevronRight,
  ChevronLeft,
  Facebook,
  Instagram,
  Twitter
} from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<Record<string, string>>({});
  const ref = searchParams.get('ref');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('produtos')
        .select('*, profiles(email, full_name, avatar_url)')
        .eq('id', id)
        .single();

      if (fetchError) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('produtos')
          .select('*')
          .eq('id', id)
          .single();
        
        if (fallbackError) throw fallbackError;
        setProduct(fallbackData);
      } else {
        setProduct(data);
        // Initialize variations
        if (data.variations) {
          const initialVars: Record<string, string> = {};
          Object.entries(data.variations).forEach(([key, values]: [string, any]) => {
            if (values && values.length > 0) {
              initialVars[key] = values[0];
            }
          });
          setSelectedVariation(initialVars);
        }
      }
    } catch (err) {
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (type: 'inc' | 'dec') => {
    if (type === 'inc') {
      if (product && quantity < product.quantity) {
        setQuantity(prev => prev + 1);
      }
    } else if (type === 'dec' && quantity > 1) {
      setQuantity(prev => prev - 1);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium group"
        >
          <div className="p-2 bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800 group-hover:border-indigo-100 dark:group-hover:border-indigo-900 transition-all">
            <ArrowLeft className="h-5 w-5" />
          </div>
          Voltar para a loja
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Images */}
          <div className="space-y-6">
            <div className="relative aspect-square bg-white dark:bg-stone-900 rounded-[2.5rem] overflow-hidden shadow-xl shadow-stone-200/50 dark:shadow-none border border-stone-100 dark:border-stone-800 group">
              {product.imagens?.[activeImage] ? (
                <img 
                  src={product.imagens[activeImage]} 
                  alt={product.name} 
                  className="w-full h-full object-contain p-8" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-700">
                  <Package className="h-24 w-24" />
                </div>
              )}
              <button className="absolute top-6 right-6 p-3 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-2xl text-stone-900 dark:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
                <Maximize2 className="h-5 w-5" />
              </button>
            </div>
            
            {/* Thumbnails */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide justify-center">
              {product.imagens?.map((img: string, i: number) => (
                <button 
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                    activeImage === i 
                      ? 'border-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-none scale-105' 
                      : 'border-white dark:border-stone-900 hover:border-stone-200 dark:hover:border-stone-700'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i+1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full uppercase tracking-widest">
                  {product.category || 'Geral'}
                </span>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-bold text-stone-900 dark:text-white">4.8</span>
                  <span className="text-xs text-stone-400 font-medium">(124 avaliações)</span>
                </div>
              </div>
              
              <h1 className="text-4xl font-black text-stone-900 dark:text-white leading-tight">
                {product.name}
              </h1>

              {(product.brand || product.model) && (
                <div className="flex flex-wrap gap-2">
                  {product.brand && (
                    <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-bold rounded-lg">
                      Marca: {product.brand}
                    </span>
                  )}
                  {product.model && (
                    <span className="px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-bold rounded-lg">
                      Modelo: {product.model}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                  {product.price.toLocaleString()} KZ
                </div>
                <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg">
                  {product.quantity > 0 ? `Em estoque (${product.quantity})` : 'Esgotado'}
                </div>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 space-y-6">
              {/* Variations */}
              {product.variations && Object.entries(product.variations).map(([key, values]: [string, any]) => (
                values && values.length > 0 && (
                  <div key={key} className="space-y-3">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{key}</label>
                    <div className="flex flex-wrap gap-2">
                      {values.map((v: string, i: number) => (
                        <button 
                          key={i}
                          onClick={() => setSelectedVariation(prev => ({ ...prev, [key]: v }))}
                          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                            selectedVariation[key] === v
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                              : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ))}

              {/* Quantity */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Quantidade</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-stone-50 dark:bg-stone-800 rounded-xl p-1">
                    <button 
                      onClick={() => handleQuantityChange('dec')}
                      className="w-10 h-10 flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-700 rounded-lg transition-all"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-bold text-stone-900 dark:text-white">
                      {quantity}
                    </span>
                    <button 
                      onClick={() => handleQuantityChange('inc')}
                      className="w-10 h-10 flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-700 rounded-lg transition-all"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <button 
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (ref) params.set('ref', ref);
                    params.set('qty', quantity.toString());
                    navigate(`/checkout/${product.id}?${params.toString()}`);
                  }}
                  disabled={product.quantity <= 0}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-3 group disabled:opacity-50"
                >
                  <ShoppingBag className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  Finalizar Compra
                </button>
                <Link to={`/dashboard?tab=afiliar-me&id=${product.id}`} className="w-full py-4 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-2xl font-bold text-center block hover:bg-stone-100 dark:hover:bg-stone-700 transition-all">
                  Vender como afiliado
                </Link>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50/50 dark:bg-stone-900/50 rounded-2xl border border-stone-100 dark:border-stone-800 flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-stone-800 rounded-lg shadow-sm">
                  <Truck className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-stone-900 dark:text-white">Entrega Rápida</p>
                  <p className="text-stone-500">Em toda Luanda</p>
                </div>
              </div>
              <div className="p-4 bg-stone-50/50 dark:bg-stone-900/50 rounded-2xl border border-stone-100 dark:border-stone-800 flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-stone-800 rounded-lg shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-stone-900 dark:text-white">Compra Segura</p>
                  <p className="text-stone-500">Garantia Total</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-16 space-y-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-stone-900 dark:text-white">Descrição do Produto</h2>
            <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800" />
          </div>
          <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm">
            <div className="prose dark:prose-invert max-w-none text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-wrap text-lg">
              {product.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
