import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Wallet, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  X, 
  CreditCard, 
  Phone, 
  Building2,
  AlertCircle
} from 'lucide-react';

interface WalletData {
  balance: number;
  pending_balance: number;
}

interface WalletCardProps {
  hideWithdraw?: boolean;
}

export default function WalletCard({ hideWithdraw = false }: WalletCardProps) {
  const { user, profile } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [pendingWithdrawalTotal, setPendingWithdrawalTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('IBAN');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchWallet();
      fetchWithdrawalHistory();
    }
  }, [user]);

  const fetchWithdrawalHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawalHistory(data || []);
    } catch (err) {
      console.error('Error fetching withdrawal history:', err);
    }
  };

  const fetchWallet = async () => {
    try {
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance, pending_balance')
        .eq('user_id', user?.id)
        .single();

      if (walletError) throw walletError;
      setWallet(walletData);

      // Fetch pending withdrawals to calculate effective balance
      const { data: pendingData, error: pendingError } = await supabase
        .from('withdrawal_requests')
        .select('amount')
        .eq('user_id', user?.id)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;
      const totalPending = pendingData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
      setPendingWithdrawalTotal(totalPending);
    } catch (err) {
      console.error('Error fetching wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const isAffiliate = profile?.role === 'afiliado';
  const withdrawalFee = isAffiliate ? 200 : 0;
  const minWithdrawal = 500;
  const effectiveBalance = (wallet?.balance || 0) - pendingWithdrawalTotal;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !wallet) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < minWithdrawal) {
      setError(`O valor mínimo para saque é ${minWithdrawal.toLocaleString()} Kz.`);
      return;
    }

    if (amount > effectiveBalance) {
      setError('Saldo insuficiente (considerando saques pendentes).');
      return;
    }

    if (!withdrawDetails) {
      setError('Preencha os detalhes do pagamento.');
      return;
    }

    setWithdrawing(true);
    setError(null);

    try {
      // 1. Create withdrawal request
      // We store the total amount that will be deducted from the wallet
      const { error: requestError } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount,
          method: withdrawMethod,
          details: { 
            info: withdrawDetails,
            fee: withdrawalFee,
            net_amount: amount - withdrawalFee
          },
          status: 'pending'
        });

      if (requestError) throw requestError;

      // Note: We NO LONGER deduct from balance here. 
      // The deduction happens in AdminDashboard when approved.

      setSuccess(true);
      setTimeout(() => {
        setShowWithdrawModal(false);
        setSuccess(false);
        setWithdrawAmount('');
        setWithdrawDetails('');
        fetchWallet();
      }, 2000);
    } catch (err) {
      console.error('Error withdrawing:', err);
      setError('Erro ao processar saque. Tente novamente.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-sm animate-pulse">
        <div className="h-4 w-24 bg-stone-100 dark:bg-stone-800 rounded mb-4" />
        <div className="h-8 w-48 bg-stone-100 dark:bg-stone-800 rounded" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Saldo Disponível</p>
              <h2 className="text-3xl font-black text-stone-900 dark:text-white">
                {wallet?.balance.toLocaleString() || '0,00'} Kz
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Saldo Pendente</p>
              <h2 className="text-xl font-black text-stone-900 dark:text-white">
                {wallet?.pending_balance.toLocaleString() || '0,00'} Kz
              </h2>
            </div>
          </div>
          {!hideWithdraw && (
            <button 
              onClick={() => setShowWithdrawModal(true)}
              className="px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition-all flex items-center gap-2"
            >
              <ArrowUpRight className="h-4 w-4" />
              Sacar
            </button>
          )}
        </div>

        <div className="pt-6 border-t border-stone-100 dark:border-stone-800 flex items-center gap-6">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium">Saques processados com segurança</span>
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="pt-8 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-stone-400" />
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">Histórico de Saques</h3>
          </div>

          <div className="space-y-4">
            {withdrawalHistory.length === 0 ? (
              <div className="py-8 text-center text-stone-400 dark:text-stone-500 text-sm">
                Nenhum saque solicitado ainda.
              </div>
            ) : (
              withdrawalHistory.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      request.status === 'approved' 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                        : request.status === 'rejected'
                        ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      {request.status === 'approved' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-stone-900 dark:text-white text-sm">
                        Saque via {request.method}
                      </div>
                      <div className="text-[10px] text-stone-400 uppercase tracking-widest">
                        {new Date(request.created_at).toLocaleDateString()} • {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-stone-900 dark:text-white text-sm">
                      {request.amount.toLocaleString()} Kz
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${
                      request.status === 'approved' 
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : request.status === 'rejected'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {request.status === 'approved' ? 'Concluído' : request.status === 'rejected' ? 'Recusado' : 'Pendente'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-[2.5rem] p-8 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-6 relative overflow-hidden">
            {success ? (
              <div className="py-12 text-center space-y-4">
                <div className="h-20 w-20 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-black text-stone-900 dark:text-white">Solicitação Enviada!</h3>
                <p className="text-stone-500 dark:text-stone-400">Seu saque está sendo processado e será creditado em breve.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-stone-900 dark:text-white">Solicitar Saque</h3>
                  <button onClick={() => setShowWithdrawModal(false)} className="text-stone-400 hover:text-stone-900 dark:hover:text-white">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1.5">Valor do Saque</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-stone-400 dark:text-stone-500">Kz</span>
                      <input 
                        type="number" 
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0,00" 
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" 
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">Disponível: {effectiveBalance.toLocaleString()} Kz</p>
                      {withdrawalFee > 0 && (
                        <p className="text-[10px] text-rose-400 font-bold">Taxa: {withdrawalFee.toLocaleString()} Kz</p>
                      )}
                    </div>
                    {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && withdrawalFee > 0 && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">Você receberá: {(parseFloat(withdrawAmount) - withdrawalFee).toLocaleString()} Kz</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1.5">Método de Recebimento</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'IBAN', label: 'IBAN', icon: Building2 },
                        { id: 'PayPay', label: 'PayPay', icon: CreditCard },
                        { id: 'Multicaixa Express', label: 'Multicaixa Express', icon: CreditCard },
                        { id: 'Unitel Money', label: 'Unitel Money', icon: Phone },
                        { id: 'AfriMoney', label: 'AfriMoney', icon: Phone }
                      ].map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setWithdrawMethod(method.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                            withdrawMethod === method.id 
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                              : 'border-stone-100 dark:border-stone-800 hover:border-stone-200 dark:hover:border-stone-700 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          <method.icon className="h-4 w-4" />
                          <span className="text-sm font-bold">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1.5">
                      {withdrawMethod === 'IBAN' ? 'Número do IBAN' : 'Número de Telefone / Conta'}
                    </label>
                    <input 
                      type="text" 
                      value={withdrawDetails}
                      onChange={(e) => setWithdrawDetails(e.target.value)}
                      placeholder={withdrawMethod === 'IBAN' ? 'AO06 0000...' : '900 000 000'}
                      className="w-full px-4 py-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={withdrawing}
                    className="w-full py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {withdrawing ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white dark:border-stone-900/30 dark:border-t-stone-900 rounded-full animate-spin" />
                    ) : (
                      'Confirmar Saque'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
