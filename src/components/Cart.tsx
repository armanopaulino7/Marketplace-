import React from 'react';
import { useCart } from '../contexts/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Cart() {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="bg-stone-100 dark:bg-stone-900 p-8 rounded-full">
          <ShoppingBag className="h-12 w-12 text-stone-400" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">Seu carrinho está vazio</h2>
          <p className="text-stone-500">Adicione alguns produtos para começar suas compras.</p>
        </div>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
        >
          Explorar Marketplace
        </button>
      </div>
    );
  }

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=checkout');
      return;
    }
    // For now, we'll redirect to a multi-item checkout or handle it in the existing checkout
    // Since the current checkout is single-item, we might need to update it or create a new one.
    // Let's assume we'll update the existing checkout to handle cart items if no ID is provided.
    navigate('/checkout');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Seu Carrinho</h1>
          <span className="text-stone-500 font-medium">{totalItems} itens</span>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {cart.map((item) => (
              <div key={item.id} className="p-6 flex items-center gap-6 group">
                <div className="h-24 w-24 bg-stone-100 dark:bg-stone-800 rounded-2xl overflow-hidden flex-shrink-0 border border-stone-200 dark:border-stone-700">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-stone-900 dark:text-white text-lg truncate">{item.name}</h3>
                  <p className="text-indigo-600 font-black mt-1">{item.price.toLocaleString()} Kz</p>
                  
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center bg-stone-50 dark:bg-stone-800 rounded-xl p-1 border border-stone-100 dark:border-stone-700">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-stone-900 dark:text-white text-sm">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-stone-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <p className="font-black text-stone-900 dark:text-white">
                    {(item.price * item.quantity).toLocaleString()} Kz
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm sticky top-24">
          <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-6">Resumo do Pedido</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal</span>
              <span className="font-bold text-stone-900 dark:text-white">{totalPrice.toLocaleString()} Kz</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Entrega</span>
              <span className="text-emerald-600 font-bold uppercase text-[10px] tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">Grátis</span>
            </div>
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-between items-end">
              <span className="text-stone-900 dark:text-white font-bold">Total</span>
              <div className="text-right">
                <p className="text-2xl font-black text-indigo-600 leading-none">{totalPrice.toLocaleString()} Kz</p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none"
          >
            Finalizar Compra
            <ArrowRight className="h-5 w-5" />
          </button>

          <p className="mt-6 text-center text-xs text-stone-400">
            Pagamento seguro via transferência bancária ou referência Multicaixa.
          </p>
        </div>
      </div>
    </div>
  );
}
