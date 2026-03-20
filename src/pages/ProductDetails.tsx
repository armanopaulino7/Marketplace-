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
  Twitter,
  Heart,
  Flag,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { ReviewSection } from '../components/ReviewSection';
import { cn, isOnline } from '../lib/utils';

export default function ProductDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<Record<string, string>>({});
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const ref = searchParams.get('ref');

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProduct();
    if (user) checkWishlist();
  }, [id, user]);

  const checkWishlist = async () => {
    const { data } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', user?.id)
      .eq('product_id', id)
      .single();
    
    if (data) setIsWishlisted(true);
  };

  const toggleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isWishlisted) {
      await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', id);
      setIsWishlisted(false);
    } else {
      await supabase.from('wishlist').insert({ user_id: user.id, product_id: id });
      setIsWishlisted(true);
    }
  };

  const handleReport = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsReporting(true);
    const { error } = await supabase.from('product_reports').insert({
      reporter_id: user.id,
      product_id: id,
      reason: reportReason
    });

    if (!error) {
      setShowReportModal(false);
      setReportReason('');
      alert('Denúncia enviada com sucesso. Nossa equipe irá analisar.');
    }
    setIsReporting(false);
  };

  const fetchProduct = async () => {
    if (!id) return;
    
    // Check if ID is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error('Invalid UUID format:', id);
      setProduct(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch product with producer profile in one query if possible
      // Using the correct join syntax: table!column_name
      const { data, error: fetchError } = await supabase
        .from('produtos')
        .select(`
          *,
          profiles!producer_id (
            id,
            email,
            full_name,
            avatar_url,
            is_verified,
            last_seen
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Fetch error with join:', fetchError);
        // Try fallback without join
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('produtos')
          .select('*')
          .eq('id', id)
          .single();
        
        if (fallbackError) {
          console.error('Fallback fetch error:', fallbackError);
          setProduct(null);
        } else {
          // If product found, try to fetch profile separately
          if (fallbackData && fallbackData.producer_id) {
            console.log('Product found without join, fetching profile separately for producer_id:', fallbackData.producer_id);
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, email, full_name, avatar_url, is_verified, last_seen')
              .eq('id', fallbackData.producer_id)
              .single();
            
            if (profileError) {
              console.error('Error fetching profile separately:', profileError);
            }

            if (profileData) {
              console.log('Profile data fetched separately:', profileData);
              fallbackData.profiles = profileData;
            } else {
              console.warn('No profile data found for producer_id:', fallbackData.producer_id);
            }
          }
          setProduct(fallbackData);
        }
      } else {
        console.log('Product fetched with join successfully:', data);
        if (!data.profiles) {
          console.warn('Product fetched but profiles is null. producer_id was:', data.producer_id);
        }
        setProduct(data);
      }

      // Initialize variations
      const targetProduct = data || (product as any);
      if (targetProduct?.variations) {
        const initialVars: Record<string, string> = {};
        Object.entries(targetProduct.variations).forEach(([key, values]: [string, any]) => {
          if (values && Array.isArray(values) && values.length > 0) {
            initialVars[key] = values[0];
          }
        });
        setSelectedVariation(initialVars);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setProduct(null);
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
              <div className="flex items-center justify-between">
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
                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleWishlist}
                    className={cn(
                      "p-3 rounded-2xl transition-all shadow-sm border",
                      isWishlisted 
                        ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-900/20 dark:border-rose-900/30" 
                        : "bg-white border-stone-100 text-stone-400 hover:text-rose-600 dark:bg-stone-900 dark:border-stone-800"
                    )}
                  >
                    <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
                  </button>
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className="p-3 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl text-stone-400 hover:text-rose-600 transition-all shadow-sm"
                  >
                    <Flag className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  {product.profiles?.avatar_url ? (
                    <img src={product.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs font-bold">
                      {product.profiles?.full_name?.[0] || 'P'}
                    </div>
                  )}
                </div>
                <div className="text-sm font-bold text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                  Produtor: <span className="text-stone-900 dark:text-white">{product.profiles?.full_name || product.profiles?.email || 'Produtor'}</span>
                  {product.profiles?.is_verified && (
                    <span className="flex items-center gap-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      <ShieldCheck className="h-3 w-3" />
                      Verificado
                    </span>
                  )}
                  {isOnline(product.profiles?.last_seen) ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-widest ml-2">
                      <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse block" />
                      Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-2">
                      <span className="h-2 w-2 bg-stone-300 dark:bg-stone-700 rounded-full block" />
                      Offline
                    </span>
                  )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      addToCart(product, quantity);
                      setAddedToCart(true);
                      setTimeout(() => setAddedToCart(false), 2000);
                    }}
                    disabled={product.quantity <= 0}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-3 group disabled:opacity-50",
                      addedToCart 
                        ? "bg-emerald-600 text-white shadow-emerald-100" 
                        : "bg-white dark:bg-stone-800 text-stone-900 dark:text-white border border-stone-200 dark:border-stone-700 shadow-stone-100 dark:shadow-none hover:bg-stone-50 dark:hover:bg-stone-700"
                    )}
                  >
                    {addedToCart ? (
                      <>
                        <Check className="h-6 w-6" />
                        Adicionado!
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-6 w-6 group-hover:scale-110 transition-transform" />
                        Adicionar ao Carrinho
                      </>
                    )}
                  </button>
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
                    Finalizar Compra
                  </button>
                </div>
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

        {/* Reviews Section */}
        <ReviewSection productId={product.id} />
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-stone-100 dark:border-stone-800 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Flag className="h-6 w-6 text-rose-500" />
                Denunciar Produto
              </h3>
              <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors">
                <X className="h-6 w-6 text-stone-400" />
              </button>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
              Por que você está denunciando este produto? Nossa equipe irá analisar sua denúncia em até 24h.
            </p>
            <div className="space-y-4">
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Descreva o motivo da denúncia..."
                className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-rose-500 min-h-[120px]"
              />
              <button
                onClick={handleReport}
                disabled={isReporting || !reportReason}
                className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                {isReporting ? 'Enviando...' : 'Enviar Denúncia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
