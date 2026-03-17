import React, { useEffect, useState } from 'react';
import { Ticket, Plus, Trash2, Edit2, X, Check, Calendar, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  product_id?: string;
  min_purchase_amount: number;
  max_uses?: number;
  used_count: number;
  expires_at?: string;
  active: boolean;
}

export function CouponManager() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [productId, setProductId] = useState('');
  const [minAmount, setMinAmount] = useState(0);
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    if (user) {
      fetchCoupons();
      fetchProducts();
    }
  }, [user]);

  const fetchCoupons = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('producer_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (data) setCoupons(data);
    setIsLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('produtos')
      .select('id, name')
      .eq('producer_id', user?.id);
    
    if (data) setProducts(data);
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase
      .from('coupons')
      .insert({
        code: code.toUpperCase(),
        discount_type: discountType,
        discount_value: discountValue,
        producer_id: user?.id,
        product_id: productId || null,
        min_purchase_amount: minAmount,
        max_uses: maxUses ? parseInt(maxUses) : null,
        expires_at: expiresAt || null,
      });

    if (!error) {
      setShowAddModal(false);
      resetForm();
      fetchCoupons();
    } else {
      alert('Erro ao criar cupom: ' + error.message);
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setCode('');
    setDiscountType('percentage');
    setDiscountValue(0);
    setProductId('');
    setMinAmount(0);
    setMaxUses('');
    setExpiresAt('');
  };

  const toggleCouponStatus = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('coupons')
      .update({ active: !currentStatus })
      .eq('id', id);
    
    fetchCoupons();
  };

  const deleteCoupon = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cupom?')) {
      await supabase.from('coupons').delete().eq('id', id);
      fetchCoupons();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Gerenciar Cupons</h2>
          <p className="text-sm text-stone-500">Crie códigos de desconto para seus clientes</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
        >
          <Plus className="h-5 w-5" />
          Novo Cupom
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-stone-100 dark:bg-stone-800 animate-pulse rounded-[2rem]" />
          ))
        ) : coupons.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white dark:bg-stone-900 rounded-[2rem] border border-dashed border-stone-200 dark:border-stone-800">
            <Ticket className="h-12 w-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">Você ainda não criou nenhum cupom.</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <div key={coupon.id} className={cn(
              "bg-white dark:bg-stone-900 p-6 rounded-[2rem] border transition-all relative overflow-hidden group",
              coupon.active ? "border-stone-100 dark:border-stone-800" : "border-stone-100 dark:border-stone-800 opacity-60"
            )}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
                  <Ticket className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleCouponStatus(coupon.id, coupon.active)}
                    className={cn(
                      "p-2 rounded-xl transition-colors",
                      coupon.active ? "text-emerald-600 hover:bg-emerald-50" : "text-stone-400 hover:bg-stone-100"
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => deleteCoupon(coupon.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">{coupon.code}</h3>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `${coupon.discount_value.toLocaleString()} KZ OFF`}
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-stone-50 dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400 uppercase tracking-widest font-bold">Uso</span>
                  <span className="text-stone-900 dark:text-white font-bold">{coupon.used_count} / {coupon.max_uses || '∞'}</span>
                </div>
                {coupon.expires_at && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-400 uppercase tracking-widest font-bold">Expira em</span>
                    <span className="text-stone-900 dark:text-white font-bold">{format(new Date(coupon.expires_at), 'dd/MM/yyyy')}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-stone-100 dark:border-stone-800 animate-in fade-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-stone-900 dark:text-white">Novo Cupom</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors">
                <X className="h-6 w-6 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleAddCoupon} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Código do Cupom</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="EX: PROMO10"
                  className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Tipo</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (KZ)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Valor</label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value))}
                    className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Produto (Opcional)</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Todos os Produtos</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Limite de Usos</label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Ilimitado"
                    className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Expiração</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
              >
                {isSubmitting ? 'Criando...' : 'Criar Cupom'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
