import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings, 
  CheckSquare, 
  Wallet, 
  Clock, 
  Truck, 
  Home as HomeIcon,
  User as UserIcon,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  Camera,
  Search,
  ArrowRight,
  LogOut,
  DollarSign,
  X,
  RefreshCw
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { createNotification } from '../../lib/notifications';
import WalletCard from '../../components/WalletCard';
import { useAuth } from '../../contexts/AuthContext';
import ImageUpload from '../../components/ImageUpload';
import ChangePasswordForm from '../../components/ChangePasswordForm';
import { ProductReports } from '../../components/ProductReports';
import { AuditLogs } from '../../components/AuditLogs';

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionProductId, setRejectionProductId] = useState<string | null>(null);

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState('');
  const [approvalProductId, setApprovalProductId] = useState<string | null>(null);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [deliveryFees, setDeliveryFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newFee, setNewFee] = useState({ neighborhood: '', fee: '' });
  const [editingFee, setEditingFee] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [adminWallet, setAdminWallet] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    users: 0,
    totalSales: 0,
    platformRevenue: 0,
    pendingWithdrawals: 0,
    pendingProducts: 0,
    totalPlatformFees: 0,
    totalWithdrawalFees: 0,
    walletBalance: 0,
    pendingWalletBalance: 0
  });
  const [salesHistory, setSalesHistory] = useState<any[]>([]);

  const [bankDetails, setBankDetails] = useState({
    iban_platform: '',
    paypay_platform: '',
    express_platform: '',
    unitel_platform: '',
    afri_platform: '',
    iban_private: '',
    bank_name_private: '',
    holder_name_private: ''
  });

  useEffect(() => {
    if (profile) {
      setBankDetails({
        iban_platform: profile.iban_platform || '',
        paypay_platform: profile.paypay_platform || '',
        express_platform: profile.express_platform || '',
        unitel_platform: profile.unitel_platform || '',
        afri_platform: profile.afri_platform || '',
        iban_private: profile.iban_private || '',
        bank_name_private: profile.bank_name_private || '',
        holder_name_private: profile.holder_name_private || ''
      });
    }
  }, [profile]);

  const handleUpdateBankDetails = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(bankDetails)
        .eq('id', user.id);

      if (error) throw error;
      alert('Dados bancários atualizados com sucesso!');
    } catch (err: any) {
      console.error('Error updating bank details:', err);
      alert('Erro ao atualizar dados bancários: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile?.role === 'adm') {
      if (activeTab === 'home') {
        fetchProducts();
      }
      if (activeTab === 'pedidos' || activeTab === 'dashboard') {
        fetchOrders();
      }
      fetchStats();
      fetchPendingProducts();
      fetchPendingWithdrawals();
      fetchDeliveryFees();
      fetchUsers();
      fetchAdminWallet();
    }
  }, [user, profile, activeTab]);

  const fetchAdminWallet = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setAdminWallet(data);
    } catch (err) {
      console.error('Error fetching admin wallet:', err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log('Fetching orders for admin...');
      // Try with join first - including producer and product details
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          produtos:product_id (name, imagens),
          producer:profiles!producer_id (full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Join in fetchOrders failed, fetching without join:', error);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        
        // Manual join for fallback
        const ordersWithData = await Promise.all((fallbackData || []).map(async (order) => {
          const { data: prodData } = await supabase.from('produtos').select('name, imagens').eq('id', order.product_id).single();
          const { data: profileData } = await supabase.from('profiles').select('full_name, email').eq('id', order.producer_id).single();
          return { ...order, produtos: prodData, producer: profileData };
        }));
        
        setOrders(ordersWithData);
      } else {
        console.log(`Fetched ${data?.length || 0} orders`);
        setOrders(data || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      console.log(`Updating order ${orderId} to ${status}`);
      // Get order details first to process funds if completed or restore stock if cancelled
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*, produtos(name, quantity)')
        .eq('id', orderId)
        .single();
      
      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      // 1. Notify Customer about status change
      await createNotification(
        order.customer_id,
        'Status do Pedido Atualizado',
        `Seu pedido de ${Array.isArray(order.produtos) ? (order.produtos as any)[0]?.name : (order.produtos as any)?.name} agora está: ${status === 'completed' ? 'Concluído' : status === 'cancelled' ? 'Cancelado' : status === 'shipped' ? 'Enviado' : status}`,
        'order_status',
        '/dashboard/cliente'
      );

      // If status is being updated to 'cancelled' and it wasn't cancelled before
      if (status === 'cancelled' && order.status !== 'cancelled') {
        console.log('Restoring stock for cancelled order:', order);
        const { error: stockError } = await supabase.rpc('increment_product_stock', {
          product_id_param: order.product_id,
          amount_param: order.quantity || 1
        });
        if (stockError) console.error('Error restoring stock:', stockError);
      }

      // If status is being updated to 'completed' and it wasn't completed before and funds not processed
      if (status === 'completed' && order.status !== 'completed' && !order.funds_processed) {
        console.log('Order marked as completed, processing funds:', order);
        await handleProcessOrderFunds(order);
      }

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, funds_processed: status === 'completed' ? true : o.funds_processed } : o));
      fetchOrders(); // Refresh to ensure sync
      if (status === 'completed') {
        alert('Pedido marcado como concluído e saldos creditados!');
        fetchStats();
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      alert('Erro ao atualizar status do pedido: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const handleSyncAllFunds = async () => {
    setLoading(true);
    try {
      const { data: pendingOrders, error } = await supabase
        .from('orders')
        .select('*, produtos(name)')
        .eq('status', 'completed')
        .eq('funds_processed', false);

      if (error) throw error;

      if (!pendingOrders || pendingOrders.length === 0) {
        alert('Todos os saldos já estão processados.');
        return;
      }

      if (confirm(`Deseja processar os saldos de ${pendingOrders.length} pedidos pendentes?`)) {
        let successCount = 0;
        for (const order of pendingOrders) {
          const success = await handleProcessOrderFunds(order);
          if (success) successCount++;
        }
        alert(`Processamento concluído: ${successCount} de ${pendingOrders.length} pedidos processados com sucesso.`);
        fetchOrders();
        fetchStats();
      }
    } catch (err: any) {
      console.error('Error syncing funds:', err);
      alert('Erro ao sincronizar saldos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessOrderFunds = async (order: any) => {
    if (order.funds_processed) {
      alert('Os fundos para este pedido já foram processados.');
      return;
    }

    try {
      console.log('Processing funds for order:', order.id);
      
      // 1. Process Producer Funds
      if (order.producer_id && Number(order.producer_commission) > 0) {
        console.log(`Processing producer funds: ${order.producer_commission} for ${order.producer_id}`);
        const { error: pErr } = await supabase.rpc('process_sale_funds', {
          user_id_param: order.producer_id,
          amount_param: Number(order.producer_commission),
          description_param: `Venda concluída: ${Array.isArray(order.produtos) ? (order.produtos as any)[0]?.name : (order.produtos as any)?.name}`,
          days_to_release: 0
        });
        if (pErr) throw new Error(`Erro Produtor: ${pErr.message}`);
      }

      // 2. Process Affiliate Funds
      if (order.affiliate_id && Number(order.commission_amount) > 0) {
        console.log(`Processing affiliate funds: ${order.commission_amount} for ${order.affiliate_id}`);
        const { error: aErr } = await supabase.rpc('process_sale_funds', {
          user_id_param: order.affiliate_id,
          amount_param: Number(order.commission_amount),
          description_param: `Comissão de afiliado concluída: ${Array.isArray(order.produtos) ? (order.produtos as any)[0]?.name : (order.produtos as any)?.name}`,
          days_to_release: 0
        });
        if (aErr) throw new Error(`Erro Afiliado: ${aErr.message}`);
      }

      // 3. Process Platform Fee + Delivery Fee (Admin)
      const adminAmount = Number(order.platform_fee) + Number(order.delivery_fee || 0);
      if (adminAmount > 0) {
        console.log(`Processing admin funds (fees + delivery): ${adminAmount}`);
        
        // Use current user if they are admin, otherwise find an admin
        let adminId = user?.id;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user?.id)
          .single();
          
        if (profile?.role !== 'adm' && profile?.role !== 'admin') {
          const { data: adminUser } = await supabase
            .from('profiles')
            .select('id')
            .or('role.eq.admin,role.eq.adm')
            .limit(1)
            .single();
          if (adminUser) adminId = adminUser.id;
        }

        if (adminId) {
          const { error: admErr } = await supabase.rpc('process_sale_funds', {
            user_id_param: adminId,
            amount_param: adminAmount,
            description_param: `Taxas e Entrega: ${Array.isArray(order.produtos) ? (order.produtos as any)[0]?.name : (order.produtos as any)?.name}`,
            days_to_release: 0
          });
          if (admErr) throw new Error(`Erro Admin: ${admErr.message}`);
        }
      }

      // Mark as processed
      const { error: updateError } = await supabase
        .from('orders')
        .update({ funds_processed: true })
        .eq('id', order.id);

      if (updateError) throw updateError;

      console.log('All funds processed successfully');
      setWalletRefreshKey(prev => prev + 1);
      
      // Notify Producer
      if (order.producer_id) {
        await createNotification(
          order.producer_id,
          'Pedido Concluído',
          `O pedido do produto ${Array.isArray(order.produtos) ? (order.produtos as any)[0]?.name : (order.produtos as any)?.name} foi marcado como concluído e o saldo creditado.`,
          'sale',
          '/dashboard/produtor'
        );
      }

      // Notify Affiliate
      if (order.affiliate_id) {
        await createNotification(
          order.affiliate_id,
          'Venda de Afiliado Concluída',
          `A venda do produto ${Array.isArray(order.produtos) ? (order.produtos as any)[0]?.name : (order.produtos as any)?.name} que você indicou foi concluída e sua comissão creditada.`,
          'commission',
          '/dashboard/afiliado'
        );
      }

      return true;
    } catch (fundErr: any) {
      console.error('Error processing funds:', fundErr);
      alert('Erro ao processar os saldos: ' + fundErr.message);
      return false;
    }
  };

  const handleApproveWithdrawal = async (withdrawal: any) => {
    if (!window.confirm(`Deseja aprovar o saque de ${withdrawal.amount.toLocaleString()} Kz para ${withdrawal.profiles?.email || 'este usuário'}?`)) {
      return;
    }

    setLoading(true);
    try {
      // 1. Deduct from user's wallet balance using RPC
      const { error: deductError } = await supabase.rpc('deduct_wallet_balance', {
        user_id_param: withdrawal.user_id,
        amount_param: withdrawal.amount,
        description_param: `Saque aprovado (${withdrawal.method})`
      });

      if (deductError) throw deductError;

      // 2. Update withdrawal request status
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', withdrawal.id);

      if (updateError) throw updateError;

      alert('Saque aprovado com sucesso!');
      fetchPendingWithdrawals();
      fetchStats();
      fetchAdminWallet();
    } catch (err: any) {
      console.error('Error approving withdrawal:', err);
      alert('Erro ao aprovar saque: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleRejectWithdrawal = async (withdrawal: any) => {
    const reason = window.prompt('Motivo da rejeição:');
    if (reason === null) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'rejected', 
          updated_at: new Date().toISOString(),
          details: { ...withdrawal.details, rejection_reason: reason }
        })
        .eq('id', withdrawal.id);

      if (error) throw error;

      alert('Saque rejeitado.');
      fetchPendingWithdrawals();
      fetchStats();
    } catch (err: any) {
      console.error('Error rejecting withdrawal:', err);
      alert('Erro ao rejeitar saque: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('status', 'approved')
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

  const [walletRefreshKey, setWalletRefreshKey] = useState(0);

  const fetchStats = async () => {
    try {
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: pendingProdCount } = await supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: pendingWithCount } = await supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      
      // Fetch total sales (GMV and platform revenue)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('amount, delivery_fee, platform_fee')
        .eq('status', 'completed');
      
      let totalSales = 0;
      let platformRevenue = 0;
      let totalPlatformFees = 0;
      if (!ordersError && orders) {
        totalSales = orders.reduce((acc, order) => acc + order.amount, 0);
        totalPlatformFees = orders.reduce((acc, order) => acc + (order.platform_fee || 0), 0);
        // Platform revenue is platform fees + delivery fees
        platformRevenue = orders.reduce((acc, order) => {
          return acc + (order.platform_fee || 0) + (order.delivery_fee || 0);
        }, 0);
      }

      // Fetch withdrawal fees (200kz)
      const { data: approvedWithdrawals } = await supabase
        .from('withdrawal_requests')
        .select('details')
        .eq('status', 'approved');
      
      const totalWithdrawalFees = (approvedWithdrawals || []).reduce((acc, w) => {
        return acc + (w.details?.fee || 0);
      }, 0);

      // Fetch admin wallet
      let walletBalance = 0;
      let pendingWalletBalance = 0;
      if (user) {
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance, pending_balance')
          .eq('user_id', user.id)
          .single();
        
        if (walletData) {
          walletBalance = walletData.balance;
          pendingWalletBalance = walletData.pending_balance;
        }
      }
      
      setStats({
        users: usersCount || 0,
        totalSales: totalSales,
        platformRevenue: platformRevenue + totalWithdrawalFees,
        pendingWithdrawals: pendingWithCount || 0,
        pendingProducts: pendingProdCount || 0,
        totalPlatformFees,
        totalWithdrawalFees,
        walletBalance,
        pendingWalletBalance
      });

      // Generate sales history for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const { data: historyData } = await supabase
        .from('orders')
        .select('amount, delivery_fee, created_at')
        .eq('status', 'completed')
        .gte('created_at', last7Days[0]);

      const historyMap = (historyData || []).reduce((acc: any, order: any) => {
        const date = order.created_at.split('T')[0];
        const productPrice = order.amount - (order.delivery_fee || 0);
        const platformFee = productPrice * 0.10;
        const total = platformFee + (order.delivery_fee || 0);
        acc[date] = (acc[date] || 0) + total;
        return acc;
      }, {});

      const chartData = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' }),
        vendas: historyMap[date] || 0
      }));

      setSalesHistory(chartData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchPendingProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try with join first
      const { data, error: fetchError } = await supabase
        .from('produtos')
        .select('*, profiles(email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.warn('Join with profiles failed, fetching without join:', fetchError);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('produtos')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        setPendingProducts(fallbackData || []);
      } else {
        setPendingProducts(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching pending products:', err);
      setError(err.message || 'Erro ao carregar produtos pendentes.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*, profiles(email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Join with profiles failed for withdrawals, fetching without join:', error);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        setPendingWithdrawals(fallbackData || []);
      } else {
        setPendingWithdrawals(data || []);
      }
    } catch (err) {
      console.error('Error fetching pending withdrawals:', err);
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

  const handleAddDeliveryFee = async () => {
    if (!newFee.neighborhood || !newFee.fee) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('delivery_fees')
        .insert([{ 
          neighborhood: newFee.neighborhood.trim(), 
          fee: parseFloat(newFee.fee) 
        }]);

      if (error) {
        if (error.code === '23505') {
          alert('Este bairro já possui uma taxa cadastrada. Edite a taxa existente ou use outro nome.');
        } else {
          throw error;
        }
        return;
      }
      
      setNewFee({ neighborhood: '', fee: '' });
      await fetchDeliveryFees();
      alert('Taxa adicionada com sucesso!');
    } catch (err: any) {
      console.error('Error adding delivery fee:', err);
      alert('Erro ao adicionar taxa: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeliveryFee = async () => {
    if (!editingFee) return;

    try {
      const { error } = await supabase
        .from('delivery_fees')
        .update({ 
          neighborhood: editingFee.neighborhood, 
          fee: parseFloat(editingFee.fee) 
        })
        .eq('id', editingFee.id);

      if (error) throw error;
      
      setEditingFee(null);
      fetchDeliveryFees();
    } catch (err) {
      console.error('Error updating delivery fee:', err);
      alert('Erro ao atualizar taxa de entrega.');
    }
  };

  const handleDeleteDeliveryFee = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta taxa?')) return;

    try {
      const { error } = await supabase
        .from('delivery_fees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchDeliveryFees();
    } catch (err) {
      console.error('Error deleting delivery fee:', err);
      alert('Erro ao remover taxa de entrega.');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleProductAction = async (productId: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      const updateData: any = { status };
      if (status === 'rejected' && reason) {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('produtos')
        .update(updateData)
        .eq('id', productId);

      if (error) throw error;
      
      // Notify Producer
      const { data: product } = await supabase
        .from('produtos')
        .select('name, producer_id')
        .eq('id', productId)
        .single();

      if (product) {
        const title = status === 'approved' ? 'Produto Aprovado!' : 'Produto Rejeitado';
        const message = status === 'approved' 
          ? `Seu produto "${product.name}" foi aprovado e já está disponível na loja.${reason ? `\n\nMensagem da administração: ${reason}` : ''}`
          : `Seu produto "${product.name}" foi rejeitado pela administração.${reason ? `\n\nMotivo da rejeição: ${reason}` : ''}`;

        await createNotification(
          product.producer_id,
          title,
          message,
          'product',
          '/dashboard/produtor'
        );
      }

      setPendingProducts(prev => prev.filter(p => p.id !== productId));
      fetchStats();
      setShowRejectionModal(false);
      setRejectionReason('');
      setRejectionProductId(null);
      setShowApprovalModal(false);
      setApprovalMessage('');
      setApprovalProductId(null);
    } catch (err: any) {
      console.error(`Error ${status} product:`, err);
      alert(`Erro ao ${status === 'approved' ? 'aprovar' : 'rejeitar'} produto: ` + (err.message || 'Erro desconhecido'));
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, status: 'approved' | 'rejected') => {
    try {
      if (status === 'approved') {
        // Get withdrawal details
        const { data: withdrawal, error: fetchError } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .eq('id', withdrawalId)
          .single();
        
        if (fetchError) throw fetchError;

        // Get current wallet balance
        const { data: wallet, error: walletFetchError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', withdrawal.user_id)
          .single();
        
        if (walletFetchError) throw walletFetchError;

        const withdrawalAmount = Number(withdrawal.amount);
        const walletBalance = Number(wallet.balance);

        if (walletBalance < withdrawalAmount) {
          alert('Usuário não possui saldo suficiente para este saque.');
          return;
        }

        // Deduct from wallet using RPC to be safer and avoid RLS issues
        const { error: walletUpdateError } = await supabase.rpc('deduct_wallet_balance', {
          user_id_param: withdrawal.user_id,
          amount_param: withdrawalAmount,
          description_param: `Saque aprovado: ${withdrawalId}`
        });
        
        if (walletUpdateError) throw walletUpdateError;

        // Credit admin with fee if applicable
        const fee = withdrawal.details?.fee || 0;
        if (fee > 0 && user) {
          await supabase.rpc('process_sale_funds', {
            user_id_param: user.id,
            amount_param: fee,
            description_param: `Taxa de saque (200kz): ${withdrawalId}`,
            days_to_release: 0
          });
        }
      }

      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ status })
        .eq('id', withdrawalId);

      if (error) throw error;
      
      // Notify User
      const { data: withdrawal } = await supabase
        .from('withdrawal_requests')
        .select('user_id, amount')
        .eq('id', withdrawalId)
        .single();

      if (withdrawal) {
        await createNotification(
          withdrawal.user_id,
          status === 'approved' ? 'Saque Aprovado!' : 'Saque Rejeitado',
          `Sua solicitação de saque no valor de ${(withdrawal.amount || 0).toLocaleString()} Kz foi ${status === 'approved' ? 'aprovada e o pagamento está sendo processado' : 'rejeitada pela administração'}.`,
          'withdrawal',
          '/dashboard'
        );
      }

      setPendingWithdrawals(prev => prev.filter(w => w.id !== withdrawalId));
      fetchStats();
      alert(`Saque ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`);
    } catch (err: any) {
      console.error(`Error ${status} withdrawal:`, err);
      let errorMessage = err.message || 'Erro desconhecido';
      
      // Check if it's a JSON error from our FirestoreErrorInfo pattern (even though this is Supabase, we can use a similar pattern if we want, but here it's just standard error)
      if (err.details) {
        errorMessage += ` (${err.details})`;
      }
      if (err.hint) {
        errorMessage += ` Hint: ${err.hint}`;
      }
      
      alert('Erro ao processar ação no saque: ' + errorMessage);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Dashboard ADM</h1>
                <p className="text-stone-500 dark:text-stone-400">Visão geral do sistema e métricas principais.</p>
              </div>
              <button
                onClick={handleSyncAllFunds}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Sincronizar Todos os Saldos
              </button>
            </div>

            <WalletCard key={`wallet-dash-${walletRefreshKey}`} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800">
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-6">Desempenho de Vendas (7 dias)</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesHistory}>
                      <defs>
                        <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickFormatter={(value) => `${(value || 0).toLocaleString()} Kz`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1c1917', 
                          border: 'none', 
                          borderRadius: '12px',
                          color: '#fff'
                        }}
                        itemStyle={{ color: '#818cf8' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="vendas" 
                        stroke="#4f46e5" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorVendas)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800">
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-6">Distribuição de Usuários</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Admins', total: users.filter(u => u.role === 'adm').length },
                      { name: 'Produtores', total: users.filter(u => u.role === 'produtor').length },
                      { name: 'Afiliados', total: users.filter(u => u.role === 'afiliado').length },
                      { name: 'Clientes', total: users.filter(u => u.role === 'cliente').length },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1c1917', 
                          border: 'none', 
                          borderRadius: '12px',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[
                { label: 'Usuários Totais', value: stats.users.toString(), icon: Users, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
                { label: 'Vendas Totais (GMV)', value: `${(stats.totalSales || 0).toLocaleString()} Kz`, icon: ShoppingBag, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' },
                { label: 'Faturamento Plataforma', value: `${(stats.platformRevenue || 0).toLocaleString()} Kz`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' },
                { label: 'Taxas 10% (Vendas)', value: `${(stats.totalPlatformFees || 0).toLocaleString()} Kz`, icon: Package, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' },
                { label: 'Taxas 200kz (Saques)', value: `${(stats.totalWithdrawalFees || 0).toLocaleString()} Kz`, icon: Wallet, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
                { label: 'Saques Pendentes', value: stats.pendingWithdrawals.toString(), icon: Wallet, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' },
                { label: 'Produtos Pendentes', value: stats.pendingProducts.toString(), icon: CheckSquare, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-stone-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-stone-500 dark:text-stone-400">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-stone-100 dark:border-stone-800">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">Atividade Recente do Sistema</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="py-12 text-center space-y-4">
                    <Clock className="h-12 w-12 text-stone-100 dark:text-stone-800 mx-auto" />
                    <p className="text-stone-500 dark:text-stone-400">Nenhuma atividade recente registrada.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'financeiro':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Gestão Financeira</h1>
              <p className="text-stone-500 dark:text-stone-400">Aprove ou rejeite solicitações de saque dos usuários.</p>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">Saques Pendentes</h2>
                <span className="px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-bold">
                  {pendingWithdrawals.length} solicitações
                </span>
              </div>
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {pendingWithdrawals.length === 0 ? (
                  <div className="p-12 text-center space-y-4">
                    <div className="h-16 w-16 bg-stone-50 dark:bg-stone-800 text-stone-300 dark:text-stone-600 rounded-full flex items-center justify-center mx-auto">
                      <Wallet className="h-8 w-8" />
                    </div>
                    <p className="text-stone-500 dark:text-stone-400">Nenhuma solicitação de saque pendente.</p>
                  </div>
                ) : (
                  pendingWithdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-stone-400 dark:text-stone-500">
                          <Wallet className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 dark:text-white">{(withdrawal.amount || 0).toLocaleString()} Kz</div>
                          <div className="text-xs text-stone-500 dark:text-stone-400">{withdrawal.profiles?.email} • {withdrawal.method}</div>
                          <div className="text-[10px] font-mono text-stone-400 dark:text-stone-500 mt-1">{withdrawal.details?.info}</div>
                          {withdrawal.details?.fee > 0 && (
                            <div className="mt-1 flex gap-2">
                              <span className="text-[10px] bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold">Taxa: {withdrawal.details.fee} Kz</span>
                              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">Líquido: {withdrawal.details.net_amount} Kz</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleWithdrawalAction(withdrawal.id, 'rejected')}
                          className="px-4 py-2 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all text-sm"
                        >
                          Rejeitar
                        </button>
                        <button 
                          onClick={() => handleWithdrawalAction(withdrawal.id, 'approved')}
                          className="px-6 py-2 bg-emerald-600 text-white font-bold hover:bg-emerald-700 rounded-xl transition-all text-sm flex items-center gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Aprovar Pagamento
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      case 'pedidos':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Gestão de Pedidos</h1>
                <p className="text-stone-500 dark:text-stone-400">Gerencie todos os pedidos realizados no sistema.</p>
              </div>
              <button
                onClick={handleSyncAllFunds}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-50"
              >
                <Clock className="h-4 w-4" />
                Sincronizar Saldos Pendentes
              </button>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
                      <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Pedido / Cliente</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Produto</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Produtor</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Valor</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Pagamento</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-stone-900 dark:text-white">#{order.id.substring(0, 8)}</div>
                          <div className="text-xs text-stone-500 dark:text-stone-400">{order.customer_name}</div>
                          <div className="text-[10px] text-stone-400">{order.customer_phone}</div>
                          <div className="mt-1 text-[10px] text-indigo-600 font-bold">{order.neighborhood}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-stone-100 dark:bg-stone-800 overflow-hidden flex-shrink-0 border border-stone-200 dark:border-stone-700">
                              {(() => {
                                const prod = Array.isArray(order.produtos) ? order.produtos[0] : order.produtos;
                                const img = prod?.imagens?.[0];
                                return img ? (
                                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="h-5 w-5 text-stone-300" />
                                  </div>
                                );
                              })()}
                            </div>
                            <div>
                              <div className="font-bold text-stone-900 dark:text-white text-sm">
                                {(() => {
                                  const prod = Array.isArray(order.produtos) ? order.produtos[0] : order.produtos;
                                  return prod?.name || 'Produto Removido';
                                })()}
                              </div>
                              <div className="text-[10px] text-stone-400 flex items-center gap-2 mt-0.5">
                                <span className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-400 font-bold">
                                  Qtd: {order.quantity || 1}
                                </span>
                                <span>•</span>
                                <span>Entrega: {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-stone-900 dark:text-white">
                            {(() => {
                              const producerData = Array.isArray(order.producer) ? order.producer[0] : order.producer;
                              return producerData?.full_name || producerData?.email || 'Produtor não encontrado';
                            })()}
                          </div>
                          {(() => {
                            const producerData = Array.isArray(order.producer) ? order.producer[0] : order.producer;
                            return producerData?.email && (
                              <div className="text-[10px] text-stone-400">{producerData.email}</div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-stone-900 dark:text-white">{(order.amount || 0).toLocaleString()} Kz</div>
                          <div className="text-[10px] text-stone-500">Entrega: {(order.delivery_fee || 0).toLocaleString()} Kz</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase">{order.payment_method}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            order.status === 'completed' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" :
                            order.status === 'cancelled' ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" :
                            "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                          )}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <select 
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="text-xs bg-stone-100 dark:bg-stone-800 border-none rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              <option value="pending">Pendente</option>
                              <option value="processing">Em Processamento</option>
                              <option value="completed">Concluído</option>
                              <option value="cancelled">Cancelado</option>
                            </select>
                            
                            {order.status === 'completed' && !order.funds_processed && (
                              <button
                                onClick={() => handleProcessOrderFunds(order)}
                                className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-lg font-bold hover:bg-amber-200 transition-colors flex items-center gap-1 justify-center whitespace-nowrap"
                                title="Processar distribuição de comissões e taxas"
                              >
                                <AlertCircle className="h-3 w-3" />
                                Liberar Saldo
                              </button>
                            )}
                            
                            {order.funds_processed && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 justify-center">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Saldo Resolvido
                                </span>
                                <span className="text-[8px] text-stone-400 text-center uppercase tracking-tighter">
                                  Taxas & Comissões OK
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-stone-400 dark:text-stone-500">
                          Nenhum pedido realizado ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'home':
        const filteredProducts = products.filter(p => 
          (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Home</h1>
            <div className="bg-white dark:bg-stone-900 p-8 sm:p-12 rounded-3xl border border-stone-200 dark:border-stone-800 text-center space-y-6">
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar produtos no marketplace..." 
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['Moda', 'Eletrônicos', 'Casa', 'Beleza'].map((cat, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSearchTerm(cat)}
                    className="p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 hover:border-indigo-200 transition-all cursor-pointer font-bold text-stone-900 dark:text-white text-sm"
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white">Produtos no CashLuanda</h2>
                  {loading && <div className="h-5 w-5 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />}
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="py-12 text-center space-y-4">
                    <Package className="h-12 w-12 text-stone-100 dark:text-stone-800 mx-auto" />
                    <p className="text-stone-500 dark:text-stone-400">Nenhum produto encontrado.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <div 
                        key={product.id} 
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all text-left group cursor-pointer"
                      >
                        <div className="h-48 bg-stone-200 dark:bg-stone-800 relative">
                          {product.imagens?.[0] ? (
                            <img src={product.imagens[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <Package className="h-12 w-12" />
                            </div>
                          )}
                          <div className="absolute top-3 right-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-black text-indigo-600 shadow-sm">
                            {(product.price || 0).toLocaleString()} Kz
                          </div>
                          <div className="absolute bottom-3 left-3">
                            <span className="px-2 py-1 bg-stone-900/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                              {product.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-stone-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">{product.name}</h3>
                          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mb-4 h-8">{product.description}</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/product/${product.id}`);
                            }}
                            className="w-full py-3 bg-stone-900 dark:bg-stone-800 text-white rounded-2xl font-bold text-xs hover:bg-stone-800 dark:hover:bg-stone-700 transition-all flex items-center justify-center gap-2"
                          >
                            Ver Detalhes
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'aprovacao-produtos':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Aprovação de Produtos</h1>
              <button 
                onClick={fetchPendingProducts}
                className="p-2 text-stone-400 hover:text-indigo-600 transition-colors"
                title="Atualizar"
              >
                <Clock className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 p-4 rounded-2xl flex items-start gap-3 text-sm mb-4">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 border-4 border-indigo-100 dark:border-stone-800 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : pendingProducts.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 p-12 rounded-3xl border border-stone-200 dark:border-stone-800 text-center space-y-4">
                <Package className="h-16 w-16 text-stone-100 dark:text-stone-800 mx-auto" />
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">Tudo em dia!</h2>
                <p className="text-stone-500 dark:text-stone-400">Não há produtos pendentes de aprovação no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingProducts.map((product) => (
                  <div key={product.id} className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center gap-6">
                    <div className="h-24 w-24 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center overflow-hidden">
                      {product.imagens?.[0] ? (
                        <img src={product.imagens[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Package className="h-10 w-10 text-stone-300 dark:text-stone-600" />
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-bold text-stone-900 dark:text-white text-lg">{product.name}</h3>
                      <p className="text-sm text-stone-500 dark:text-stone-400">Produtor: {product.profiles?.email} • {(product.price || 0).toLocaleString()} Kz</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1 flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Pickup: {product.pickup_address}
                      </p>
                      <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                        <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase rounded-lg">{product.category}</span>
                        <span className="px-2 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[10px] font-bold uppercase rounded-lg">{product.subcategory}</span>
                        {product.brand && <span className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase rounded-lg">Marca: {product.brand}</span>}
                        {product.model && <span className="px-2 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-[10px] font-bold uppercase rounded-lg">Modelo: {product.model}</span>}
                        <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase rounded-lg">Comissão: {product.commission_rate}%</span>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowDetailsModal(true);
                        }}
                        className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <Search className="h-3 w-3" />
                        Ver Detalhes Completos
                      </button>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => {
                          setApprovalProductId(product.id);
                          setShowApprovalModal(true);
                        }}
                        className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all"
                      >
                        Aprovar
                      </button>
                      <button 
                        onClick={() => {
                          setRejectionProductId(product.id);
                          setShowRejectionModal(true);
                        }}
                        className="flex-1 sm:flex-none px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'gestao-usuarios':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Gestão de Usuários</h1>
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Usuário</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Perfil</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-stone-500 dark:text-stone-400">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400 font-bold overflow-hidden border border-stone-200 dark:border-stone-700">
                              {u.avatar_url ? (
                                <img src={u.avatar_url} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                (u.full_name || u.email || 'U').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-stone-900 dark:text-white text-sm">
                                {u.full_name || u.email?.split('@')[0] || 'Usuário'}
                              </div>
                              <div className="text-xs text-stone-500 dark:text-stone-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[10px] font-bold uppercase rounded-lg">{u.role}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-sm text-stone-600 dark:text-stone-400">Ativo</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline">Editar</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'financeiro':
        return (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Financeiro</h1>
                <p className="text-stone-500 dark:text-stone-400">Gerencie o saldo da plataforma e solicitações de saque.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncAllFunds}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50"
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  Sincronizar Todos os Saldos
                </button>
                <button 
                  onClick={fetchPendingWithdrawals}
                  className="p-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-2xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
                  title="Atualizar"
                >
                  <Clock className={cn("h-5 w-5", loading && "animate-spin")} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-indigo-600" />
                    Solicitações de Saque Pendentes
                  </h2>
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-full">
                    {pendingWithdrawals.length} Pendentes
                  </span>
                </div>

                {pendingWithdrawals.length === 0 ? (
                  <div className="bg-white dark:bg-stone-900 p-12 rounded-3xl border border-stone-200 dark:border-stone-800 text-center space-y-4">
                    <CheckCircle2 className="h-16 w-16 text-emerald-100 dark:text-emerald-900/30 mx-auto" />
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white">Tudo em dia!</h2>
                    <p className="text-stone-500 dark:text-stone-400">Não há solicitações de saque pendentes no momento.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingWithdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center gap-6 group hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all">
                        <div className="h-14 w-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                          <Clock className="h-7 w-7" />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            <h3 className="font-bold text-stone-900 dark:text-white text-lg">{(withdrawal.amount || 0).toLocaleString()} Kz</h3>
                            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded uppercase tracking-wider">Pendente</span>
                          </div>
                          <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">
                            Solicitado por: <span className="text-stone-900 dark:text-white">{withdrawal.profiles?.email || 'N/A'}</span> • {new Date(withdrawal.created_at).toLocaleDateString()}
                          </p>
                          <div className="mt-2 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl text-xs text-stone-500 dark:text-stone-400 border border-stone-100 dark:border-stone-800">
                            <div className="flex flex-col gap-1">
                              <p><span className="font-bold text-stone-700 dark:text-stone-300">Método:</span> {withdrawal.method}</p>
                              <p><span className="font-bold text-stone-700 dark:text-stone-300">IBAN/Info:</span> {withdrawal.details?.info}</p>
                              {withdrawal.details?.fee && <p><span className="font-bold text-stone-700 dark:text-stone-300">Taxa:</span> {withdrawal.details.fee.toLocaleString()} Kz</p>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => handleApproveWithdrawal(withdrawal)}
                            disabled={loading}
                            className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50"
                          >
                            Aprovar
                          </button>
                          <button 
                            onClick={() => handleRejectWithdrawal(withdrawal)}
                            disabled={loading}
                            className="flex-1 sm:flex-none px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all disabled:opacity-50"
                          >
                            Recusar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-600" />
                  Sua Carteira ADM
                </h2>
                <WalletCard key={`wallet-fin-${walletRefreshKey}`} />
                
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 space-y-4">
                  <h3 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Dica Financeira
                  </h3>
                  <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">
                    Use o botão <strong>"Sincronizar Todos os Saldos"</strong> para processar fundos de pedidos concluídos e torná-los disponíveis para saque.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'taxas-entrega':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Taxas de Entrega</h1>
                <p className="text-stone-500 dark:text-stone-400">Gerencie os valores de entrega por bairro.</p>
              </div>
              <button 
                onClick={fetchDeliveryFees}
                className="p-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-2xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
                title="Atualizar Lista"
              >
                <Clock className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-6">
                {editingFee ? 'Editar Taxa' : 'Adicionar Novo Bairro'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Bairro</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Talatona"
                    value={editingFee ? editingFee.neighborhood : newFee.neighborhood}
                    onChange={(e) => editingFee 
                      ? setEditingFee({...editingFee, neighborhood: e.target.value})
                      : setNewFee({...newFee, neighborhood: e.target.value})
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-1">Taxa (Kz)</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 1500"
                    value={editingFee ? editingFee.fee : newFee.fee}
                    onChange={(e) => editingFee
                      ? setEditingFee({...editingFee, fee: e.target.value})
                      : setNewFee({...newFee, fee: e.target.value})
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
                <div className="sm:col-span-1 flex items-end gap-2">
                  {editingFee ? (
                    <>
                      <button 
                        onClick={handleUpdateDeliveryFee}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
                      >
                        Salvar
                      </button>
                      <button 
                        onClick={() => setEditingFee(null)}
                        className="flex-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 py-3 rounded-2xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={handleAddDeliveryFee}
                      className="w-full bg-stone-900 dark:bg-stone-700 text-white py-3 rounded-2xl font-bold hover:bg-stone-800 dark:hover:bg-stone-600 transition-all"
                    >
                      Adicionar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Bairro</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Taxa</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {deliveryFees.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-stone-500 dark:text-stone-400">
                        Nenhuma taxa de entrega cadastrada.
                      </td>
                    </tr>
                  ) : (
                    deliveryFees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-stone-900 dark:text-white">{fee.neighborhood}</td>
                        <td className="px-6 py-4 text-stone-600 dark:text-stone-400">{(fee.fee || 0).toLocaleString()} Kz</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setEditingFee({ ...fee, fee: fee.fee.toString() })}
                              className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline"
                            >
                              Editar
                            </button>
                            <button 
                              onClick={() => handleDeleteDeliveryFee(fee.id)}
                              className="text-rose-600 dark:text-rose-400 font-bold text-sm hover:underline"
                            >
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'denuncias':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Denúncias de Produtos</h1>
            <ProductReports />
          </div>
        );
      case 'auditoria':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Logs de Auditoria</h1>
            <AuditLogs />
          </div>
        );
      case 'perfil':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Seu Perfil</h1>
              <button 
                onClick={() => {
                  signOut();
                  navigate('/login');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
            <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 max-w-2xl">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-3xl font-bold text-indigo-600 dark:text-indigo-400 overflow-hidden border-4 border-white dark:border-stone-800 shadow-sm">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      profile?.email?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageUpload 
                      onUpload={async (url) => {
                        try {
                          // 1. Update Auth Metadata
                          const { error: authError } = await supabase.auth.updateUser({
                            data: { avatar_url: url }
                          });
                          if (authError) throw authError;

                          // 2. Update Profiles Table
                          const { error: profileError } = await supabase
                            .from('profiles')
                            .update({ avatar_url: url })
                            .eq('id', user.id);
                          if (profileError) throw profileError;

                          alert('Foto de perfil atualizada!');
                          window.location.reload();
                        } catch (err: any) {
                          console.error('Error updating profile photo:', err);
                          alert('Erro ao atualizar foto: ' + (err.message || 'Erro desconhecido'));
                        }
                      }}
                      folder="avatars"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-stone-800 p-1.5 rounded-full shadow-md border border-stone-100 dark:border-stone-700 text-stone-400 dark:text-stone-500">
                    <Camera className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white">{user?.email?.split('@')[0]}</h2>
                  <p className="text-stone-500 dark:text-stone-400">{user?.email}</p>
                  <span className="mt-2 inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full uppercase tracking-widest">Acesso Total</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => setActiveTab('dados_bancarios')}
                  className="flex items-center justify-center gap-2 p-4 border border-stone-200 dark:border-stone-800 rounded-2xl font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
                >
                  <Wallet className="h-5 w-5" />
                  Dados Bancários
                </button>
                <button 
                  onClick={() => alert('Funcionalidade de edição de dados em breve!')}
                  className="flex items-center justify-center gap-2 p-4 border border-stone-200 dark:border-stone-800 rounded-2xl font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
                >
                  <UserIcon className="h-5 w-5" />
                  Editar Dados
                </button>
              </div>
            </div>
          </div>
        );
      case 'dados_bancarios':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveTab('perfil')}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-all"
              >
                <ArrowRight className="h-5 w-5 rotate-180" />
              </button>
              <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Dados Bancários</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Platform Data */}
              <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-6 w-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white">Dados da Plataforma (Público)</h2>
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Estes dados serão exibidos aos clientes no momento do checkout.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">IBAN da Plataforma</label>
                    <input 
                      type="text" 
                      value={bankDetails.iban_platform}
                      onChange={(e) => setBankDetails({...bankDetails, iban_platform: e.target.value})}
                      placeholder="AO06..." 
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Número PayPay</label>
                    <input 
                      type="text" 
                      value={bankDetails.paypay_platform}
                      onChange={(e) => setBankDetails({...bankDetails, paypay_platform: e.target.value})}
                      placeholder="9xx..." 
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Multicaixa Express</label>
                    <input 
                      type="text" 
                      value={bankDetails.express_platform}
                      onChange={(e) => setBankDetails({...bankDetails, express_platform: e.target.value})}
                      placeholder="9xx..." 
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Unitel Money</label>
                    <input 
                      type="text" 
                      value={bankDetails.unitel_platform}
                      onChange={(e) => setBankDetails({...bankDetails, unitel_platform: e.target.value})}
                      placeholder="9xx..." 
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">AfriMoney</label>
                    <input 
                      type="text" 
                      value={bankDetails.afri_platform}
                      onChange={(e) => setBankDetails({...bankDetails, afri_platform: e.target.value})}
                      placeholder="9xx..." 
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                </div>
              </div>

              {/* Private Data */}
              <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <UserIcon className="h-6 w-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white">Seus Dados Particulares (Privado)</h2>
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Estes dados são apenas para controle interno da administração.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Nome do Banco</label>
                    <input 
                      type="text" 
                      value={bankDetails.bank_name_private}
                      onChange={(e) => setBankDetails({...bankDetails, bank_name_private: e.target.value})}
                      placeholder="Ex: BAI, BFA..." 
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">Titular da Conta</label>
                    <input 
                      type="text" 
                      value={bankDetails.holder_name_private}
                      onChange={(e) => setBankDetails({...bankDetails, holder_name_private: e.target.value})}
                      placeholder="Nome do titular" 
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-1.5">IBAN Particular</label>
                    <input 
                      type="text" 
                      value={bankDetails.iban_private}
                      onChange={(e) => setBankDetails({...bankDetails, iban_private: e.target.value})}
                      placeholder="AO06..." 
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={handleUpdateBankDetails}
                    disabled={loading}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Salvando...' : 'Salvar Todos os Dados'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 max-w-2xl">
              <ChangePasswordForm />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
      
      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Motivo da Rejeição</h2>
                <button 
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                    setRejectionProductId(null);
                  }}
                  className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-stone-400" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  Por favor, informe o motivo pelo qual este produto está sendo rejeitado. Esta mensagem será enviada ao produtor.
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex: Imagens de baixa qualidade, descrição incompleta..."
                  className="w-full h-32 px-4 py-3 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl text-stone-900 dark:text-white placeholder-stone-400 focus:ring-2 focus:ring-indigo-600 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                    setRejectionProductId(null);
                  }}
                  className="flex-1 px-6 py-4 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-2xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (rejectionProductId) {
                      handleProductAction(rejectionProductId, 'rejected', rejectionReason);
                    }
                  }}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-600/20"
                >
                  Confirmar Rejeição
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Aprovar Produto</h2>
                <button 
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalMessage('');
                    setApprovalProductId(null);
                  }}
                  className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-stone-400" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  Deseja enviar uma mensagem ao produtor junto com a aprovação? (Opcional)
                </p>
                <textarea
                  value={approvalMessage}
                  onChange={(e) => setApprovalMessage(e.target.value)}
                  placeholder="Ex: Seu produto está ótimo, boas vendas!"
                  className="w-full h-32 px-4 py-3 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl text-stone-900 dark:text-white placeholder-stone-400 focus:ring-2 focus:ring-indigo-600 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalMessage('');
                    setApprovalProductId(null);
                  }}
                  className="flex-1 px-6 py-4 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-2xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (approvalProductId) {
                      handleProductAction(approvalProductId, 'approved', approvalMessage);
                    }
                  }}
                  className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                >
                  Confirmar Aprovação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && (
        <ProductDetailsModal 
          product={selectedProduct} 
          onClose={() => setShowDetailsModal(false)}
          onAction={(id, status) => {
            if (status === 'rejected') {
              setRejectionProductId(id);
              setShowRejectionModal(true);
              setShowDetailsModal(false);
            } else if (status === 'approved') {
              setApprovalProductId(id);
              setShowApprovalModal(true);
              setShowDetailsModal(false);
            }
          }}
        />
      )}
    </Layout>
  );
}

// Product Details Modal Component
function ProductDetailsModal({ product, onClose, onAction }: { product: any, onClose: () => void, onAction: (id: string, status: 'approved' | 'rejected') => void }) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-900 dark:text-white">Detalhes do Produto</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-all">
            <LogOut className="h-5 w-5 rotate-180" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="aspect-square bg-stone-100 dark:bg-stone-800 rounded-2xl overflow-hidden">
                {product.imagens?.[0] ? (
                  <img src={product.imagens[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <Package className="h-12 w-12" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {product.imagens?.slice(1, 10).map((img: string, i: number) => (
                  <div key={i} className="aspect-square bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-black text-stone-900 dark:text-white">{product.name}</h3>
                <p className="text-indigo-600 font-bold text-xl mt-1">{(product.price || 0).toLocaleString()} Kz</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Categoria:</span>
                  <span className="font-bold text-stone-900 dark:text-white">{product.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Subcategoria:</span>
                  <span className="font-bold text-stone-900 dark:text-white">{product.subcategory}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Estoque:</span>
                  <span className="font-bold text-stone-900 dark:text-white">{product.quantity} unidades</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Comissão:</span>
                  <span className="font-bold text-emerald-600">{product.commission_rate}%</span>
                </div>
              </div>

              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Local de Levantamento</p>
                <p className="text-sm text-stone-700 dark:text-stone-300 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-indigo-500" />
                  {product.pickup_address}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-stone-900 dark:text-white">Descrição</h4>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          {product.variations && product.variations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-stone-900 dark:text-white">Variações</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {product.variations.map((v: any, i: number) => (
                  <div key={i} className="p-3 border border-stone-200 dark:border-stone-800 rounded-xl">
                    <p className="text-[10px] text-stone-500 uppercase font-bold">{v.name}</p>
                    <p className="text-sm font-bold text-stone-900 dark:text-white">{v.options.join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-stone-100 dark:border-stone-800 flex gap-3">
          <button 
            onClick={() => {
              onAction(product.id, 'rejected');
              onClose();
            }}
            className="flex-1 py-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-all"
          >
            Rejeitar Produto
          </button>
          <button 
            onClick={() => {
              onAction(product.id, 'approved');
              onClose();
            }}
            className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none"
          >
            Aprovar Produto
          </button>
        </div>
      </div>
    </div>
  );
}
