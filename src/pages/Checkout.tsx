import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  CheckCircle2,
  Package,
  AlertCircle
} from 'lucide-react';

export default function Checkout() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const ref = searchParams.get('ref');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
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

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setProcessing(true);
    try {
      const platformFeeRate = 0.05; // 5% platform fee
      const platformFee = product.price * platformFeeRate;
      const affiliateCommission = ref ? (product.price * (product.commission_rate / 100)) : 0;
      const producerAmount = product.price - affiliateCommission - platformFee;

      // 1. Create Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          product_id: product.id,
          customer_id: user.id,
          producer_id: product.producer_id,
          affiliate_id: ref || null,
          amount: product.price,
          commission_amount: affiliateCommission,
          status: 'completed'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Update Producer Wallet (Pending)
      await supabase.rpc('process_sale_funds', {
        user_id_param: product.producer_id,
        amount_param: producerAmount,
        description_param: `Venda do produto: ${product.name}`
      });

      // 3. Update Affiliate Wallet (Pending)
      if (ref && affiliateCommission > 0) {
        await supabase.rpc('process_sale_funds', {
          user_id_param: ref,
          amount_param: affiliateCommission,
          description_param: `Comissão de afiliado: ${product.name}`
        });
      }

      // 4. Update Admin Wallet (Available immediately or pending? Let's say available for platform)
      // We need to find the admin user. For simplicity, we'll use a fixed ID or just skip for now if not found.
      const { data: adminUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (adminUser) {
        await supabase.rpc('process_sale_funds', {
          user_id_param: adminUser.id,
          amount_param: platformFee,
          description_param: `Taxa de plataforma: ${product.name}`,
          days_to_release: 0 // Admin gets it immediately
        });
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error processing purchase:', err);
      alert('Erro ao processar compra. Verifique sua conexão.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-12 text-center border border-stone-200 shadow-xl space-y-6">
          <div className="h-20 w-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-black text-stone-900">Compra Realizada!</h1>
          <p className="text-stone-500">Seu pedido foi processado com sucesso. Você já pode acessar seu produto no seu painel.</p>
          <button 
            onClick={() => navigate('/dashboard/cliente')}
            className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all"
          >
            Ir para Meus Pedidos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                Pagamento
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Número do Cartão</label>
                  <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Validade</label>
                    <input type="text" placeholder="MM/AA" className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">CVV</label>
                    <input type="text" placeholder="123" className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
              </div>

              <button 
                onClick={handlePurchase}
                disabled={processing}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {processing ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    Finalizar Pagamento
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Ambiente Seguro
                </div>
                <div className="h-3 w-px bg-stone-200" />
                <div>SSL Encrypted</div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-stone-900">Resumo do Pedido</h2>
              
              <div className="flex gap-4">
                <div className="h-20 w-20 bg-stone-100 rounded-2xl overflow-hidden flex-shrink-0">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <Package className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-stone-500 mt-1">{product.category}</p>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-stone-100">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Subtotal</span>
                  <span className="font-bold text-stone-900">{product.price.toLocaleString()} Kz</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Taxas</span>
                  <span className="font-bold text-stone-900 text-emerald-600">Grátis</span>
                </div>
                <div className="flex justify-between text-lg pt-3 border-t border-stone-100">
                  <span className="font-black text-stone-900">Total</span>
                  <span className="font-black text-indigo-600">{product.price.toLocaleString()} Kz</span>
                </div>
              </div>

              {ref && (
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Desconto de Afiliado Aplicado</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
