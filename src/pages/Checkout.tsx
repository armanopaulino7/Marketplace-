import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { createNotification } from '../lib/notifications';
import { 
  ArrowLeft, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  CheckCircle2,
  Package,
  AlertCircle,
  Truck
} from 'lucide-react';

export default function Checkout() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [deliveryFees, setDeliveryFees] = useState<any[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');
  const [selectedFee, setSelectedFee] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('IBAN');
  const ref = searchParams.get('ref');
  const qty = parseInt(searchParams.get('qty') || '1');

  const [adminProfile, setAdminProfile] = useState<any>(null);

  useEffect(() => {
    fetchProduct();
    fetchDeliveryFees();
    fetchAdminProfile();
  }, [id]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/dashboard/cliente');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const fetchAdminProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or('role.eq.admin,role.eq.adm')
        .limit(1)
        .single();
      
      if (error) throw error;
      setAdminProfile(data);
    } catch (err) {
      console.error('Error fetching admin profile:', err);
    }
  };

  const getPaymentDetail = () => {
    if (!adminProfile) return 'Carregando dados de pagamento...';
    
    switch (paymentMethod) {
      case 'IBAN':
        return adminProfile.iban_platform || 'IBAN não configurado pela plataforma.';
      case 'PayPay':
        return adminProfile.paypay_platform || 'Número PayPay não configurado pela plataforma.';
      case 'Multicaixa Express':
        return adminProfile.express_platform || 'Número Multicaixa Express não configurado pela plataforma.';
      case 'Unitel Money':
        return adminProfile.unitel_platform || 'Número Unitel Money não configurado pela plataforma.';
      case 'AfriMoney':
        return adminProfile.afri_platform || 'Número AfriMoney não configurado pela plataforma.';
      default:
        return '';
    }
  };

  const fetchDeliveryFees = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_fees')
        .select('*')
        .order('neighborhood', { ascending: true });
      
      if (error) throw error;
      setDeliveryFees(data || []);
    } catch (err) {
      console.error('Error fetching delivery fees:', err);
    }
  };

  const handleNeighborhoodChange = (neighborhood: string) => {
    setSelectedNeighborhood(neighborhood);
    const fee = deliveryFees.find(f => f.neighborhood === neighborhood)?.fee || 0;
    setSelectedFee(fee);
  };

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*, profiles!producer_id(full_name, email)')
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
      const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?redirect=${currentPath}`);
      return;
    }

    setProcessing(true);
    try {
      if (!customerName || !customerPhone) {
        alert('Por favor, preencha seu nome e telefone.');
        setProcessing(false);
        return;
      }

      if (!selectedNeighborhood && deliveryFees.length > 0) {
        alert('Por favor, selecione um bairro para entrega.');
        setProcessing(false);
        return;
      }

      if (!deliveryAddress) {
        alert('Por favor, insira o endereço de entrega.');
        setProcessing(false);
        return;
      }

      if (!deliveryDate) {
        alert('Por favor, selecione uma data para entrega.');
        setProcessing(false);
        return;
      }

      const subtotal = Number(product.price) * qty;
      const platformFeeRate = 0.10; // 10% platform fee
      const platformFee = subtotal * platformFeeRate;
      const affiliateCommission = ref ? (subtotal * (Number(product.commission_rate) / 100)) : 0;
      const producerAmount = subtotal - affiliateCommission - platformFee;
      const totalOrderAmount = subtotal + Number(selectedFee);

      // 1. Create Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          product_id: product.id,
          customer_id: user.id,
          producer_id: product.producer_id,
          affiliate_id: ref || null,
          amount: totalOrderAmount,
          delivery_fee: selectedFee,
          neighborhood: selectedNeighborhood,
          delivery_address: deliveryAddress,
          customer_name: customerName,
          customer_phone: customerPhone,
          delivery_date: deliveryDate,
          payment_method: paymentMethod,
          commission_amount: affiliateCommission,
          producer_commission: producerAmount,
          platform_fee: platformFee,
          quantity: qty,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;
      
      // 1.1 Notify Producer
      await createNotification(
        product.producer_id,
        'Nova Venda Realizada!',
        `Você vendeu ${qty}x ${product.name}. Aguarde a confirmação do pagamento.`,
        'sale',
        '/dashboard/produtor'
      );

      // 1.2 Notify Customer
      await createNotification(
        user.id,
        'Pedido Realizado!',
        `Seu pedido de ${qty}x ${product.name} foi recebido e está aguardando pagamento.`,
        'order_status',
        '/dashboard/cliente'
      );

      // 1.3 Notify Affiliate (if any)
      if (ref) {
        await createNotification(
          ref,
          'Nova Indicação de Venda!',
          `Alguém comprou ${qty}x ${product.name} através do seu link. Aguarde a conclusão do pedido para receber sua comissão.`,
          'commission',
          '/dashboard/afiliado'
        );
      }

      // 2. Decrement Product Quantity (Atomic)
      const { error: updateError } = await supabase
        .rpc('decrement_product_stock', {
          product_id_param: product.id,
          amount_param: qty
        });

      if (updateError) {
        console.error('Error updating product quantity:', updateError);
        // If the RPC fails (e.g. not found), fallback to the old method but with a check
        // Or just inform the user. The RPC is safer.
        if (updateError.message?.includes('insuficiente')) {
          alert('Desculpe, o estoque deste produto acabou enquanto você finalizava a compra.');
          setProcessing(false);
          return;
        }
      }

      // Note: Funds are now processed in AdminDashboard.tsx when the order is marked as 'completed'
      // to ensure they are only released after payment verification.
      
      setSuccess(true);
    } catch (err: any) {
      console.error('Error processing purchase:', err);
      if (err.message?.includes('column "delivery_date" of relation "orders" does not exist')) {
        alert('Erro: A coluna "delivery_date" não existe no banco de dados. Por favor, execute o código SQL que enviei no seu painel do Supabase.');
      } else if (err.message?.includes('function process_sale_funds')) {
        alert('Erro: A função "process_sale_funds" não foi encontrada. Por favor, execute o código SQL que enviei no seu painel do Supabase.');
      } else {
        alert('Erro ao processar compra: ' + (err.message || 'Verifique sua conexão.'));
      }
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
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-[2.5rem] p-12 text-center border border-stone-200 dark:border-stone-800 shadow-xl space-y-6">
          <div className="h-20 w-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white">Compra Realizada!</h1>
          <p className="text-stone-500 dark:text-stone-400">Seu pedido foi processado com sucesso. Você será redirecionado para seus pedidos em instantes.</p>
          <button 
            onClick={() => navigate('/dashboard/cliente')}
            className="w-full py-4 bg-stone-900 dark:bg-stone-800 text-white rounded-2xl font-bold hover:bg-stone-800 dark:hover:bg-stone-700 transition-all"
          >
            Ir para Meus Pedidos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-900 p-8 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                Dados do Comprador
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Nome Completo</label>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Seu nome completo" 
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Número de Telefone</label>
                  <input 
                    type="tel" 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Seu número de telefone" 
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 p-8 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Truck className="h-5 w-5 text-indigo-600" />
                Entrega
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Selecione seu Bairro</label>
                  <select 
                    value={selectedNeighborhood}
                    onChange={(e) => handleNeighborhoodChange(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  >
                    <option value="">Escolha um bairro...</option>
                    {deliveryFees.map((fee) => (
                      <option key={fee.id} value={fee.neighborhood}>
                        {fee.neighborhood} (+{fee.fee.toLocaleString()} Kz)
                      </option>
                    ))}
                  </select>
                  {selectedNeighborhood && (
                    <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      Taxa de entrega: {selectedFee.toLocaleString()} Kz
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Endereço de Entrega</label>
                  <textarea 
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Rua, número da casa, ponto de referência..." 
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium min-h-[100px]" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Dia da Entrega</label>
                  <input 
                    type="date" 
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 p-8 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                Pagamento
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Forma de Pagamento</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  >
                    <option value="IBAN">IBAN</option>
                    <option value="PayPay">PayPay</option>
                    <option value="Multicaixa Express">Multicaixa Express</option>
                    <option value="Unitel Money">Unitel Money</option>
                    <option value="AfriMoney">AfriMoney</option>
                    <option value="Pagamento na entrega">Pagamento na entrega</option>
                  </select>
                </div>

                {paymentMethod !== 'Pagamento na entrega' && (
                  <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase tracking-wider">
                      <CreditCard className="h-4 w-4" />
                      Dados para Pagamento ({paymentMethod})
                    </div>
                    <div className="p-4 bg-white dark:bg-stone-800 rounded-xl border border-indigo-100 dark:border-stone-700 font-mono text-stone-900 dark:text-white break-all text-center text-lg font-black">
                      {getPaymentDetail()}
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed text-center">
                      Após clicar em finalizar, realize o pagamento para os dados acima. 
                      Sua compra será confirmada assim que o pagamento for validado pela equipe <strong>CashLuanda</strong>.
                    </p>
                  </div>
                )}
              </div>

              <button 
                onClick={handlePurchase}
                disabled={processing}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {processing ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    Finalizar Pedido
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Ambiente Seguro
                </div>
                <div className="h-3 w-px bg-stone-200 dark:bg-stone-800" />
                <div>SSL Encrypted</div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-900 p-8 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-stone-900 dark:text-white">Resumo do Pedido</h2>
              
              <div className="flex gap-4">
                <div className="h-20 w-20 bg-stone-100 dark:bg-stone-800 rounded-2xl overflow-hidden flex-shrink-0">
                  {product.imagens?.[0] ? (
                    <img src={product.imagens[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-600">
                      <Package className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-white line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Vendido por: <span className="font-bold">{product.profiles?.full_name || product.profiles?.email || 'Produtor'}</span>
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{product.category} • Qtd: {qty}</p>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-stone-100 dark:border-stone-800">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500 dark:text-stone-400">Subtotal ({qty}x)</span>
                  <span className="font-bold text-stone-900 dark:text-white">{(product.price * qty).toLocaleString()} Kz</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500 dark:text-stone-400">Taxa de Entrega</span>
                  <span className="font-bold text-stone-900 dark:text-white">
                    {selectedFee > 0 ? `${selectedFee.toLocaleString()} Kz` : 'Selecione o bairro'}
                  </span>
                </div>
                <div className="flex justify-between text-lg pt-3 border-t border-stone-100 dark:border-stone-800">
                  <span className="font-black text-stone-900 dark:text-white">Total</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400">{(product.price * qty + selectedFee).toLocaleString()} Kz</span>
                </div>
              </div>

              {ref && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Desconto de Afiliado Aplicado</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
