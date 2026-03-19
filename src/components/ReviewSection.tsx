import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, Camera, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Review {
  id: string;
  rating: number;
  comment: string;
  images: string[];
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

interface ReviewSectionProps {
  productId: string;
}

export function ReviewSection({ productId }: ReviewSectionProps) {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hasPurchased, setHasPurchased] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchReviews();
    checkPurchaseStatus();
  }, [productId, user]);

  const fetchReviews = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles:user_id (*)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
    }
    if (data) {
      setReviews(data);
      const existing = data.find((r) => r.user_id === user?.id);
      if (existing) setUserReview(existing);
    }
    setIsLoading(false);
  };

  const checkPurchaseStatus = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_id', user.id)
      .eq('product_id', productId)
      .eq('status', 'completed')
      .limit(1);

    if (data && data.length > 0) {
      setHasPurchased(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('reviews')
      .insert({
        product_id: productId,
        user_id: user.id,
        rating,
        comment,
      });

    if (error) {
      console.error('Error submitting review:', error);
      alert('Erro ao enviar avaliação: ' + error.message);
    } else {
      setComment('');
      fetchReviews();
    }
    setIsSubmitting(false);
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="mt-12 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-indigo-600" />
          Avaliações dos Clientes
        </h2>
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-2xl">
          <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-stone-400">
            ({reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'})
          </span>
        </div>
      </div>

      {user && hasPurchased && !userReview && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <h3 className="font-bold text-stone-900 dark:text-white">Deixe sua avaliação</h3>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star className={cn(
                  "h-8 w-8",
                  star <= rating ? "text-amber-500 fill-amber-500" : "text-stone-300 dark:text-stone-700"
                )} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="O que você achou do produto?"
            className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
            required
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-indigo-600 transition-colors"
            >
              <Camera className="h-4 w-4" />
              Adicionar fotos
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando...' : 'Publicar Avaliação'}
            </button>
          </div>
        </form>
      )}

      {!user && (
        <div className="bg-stone-100 dark:bg-stone-800/50 p-6 rounded-3xl text-center">
          <p className="text-stone-600 dark:text-stone-400 text-sm">
            Você precisa estar logado para avaliar este produto.
          </p>
        </div>
      )}

      {user && !hasPurchased && (
        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl flex items-center gap-3 border border-amber-100 dark:border-amber-900/30">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-800 dark:text-amber-400">
            Apenas clientes que compraram este produto podem deixar uma avaliação.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-stone-100 dark:bg-stone-800 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <p>Nenhuma avaliação ainda. Seja o primeiro!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    {review.profiles?.avatar_url ? (
                      <img src={review.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold">
                        {review.profiles?.full_name?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-stone-900 dark:text-white text-sm flex items-center gap-2">
                      {review.profiles?.full_name || 'Usuário'}
                      <Check className="h-3 w-3 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 rounded-full p-0.5" />
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal uppercase tracking-widest">Compra Verificada</span>
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={cn(
                          "h-3 w-3",
                          star <= review.rating ? "text-amber-500 fill-amber-500" : "text-stone-200 dark:text-stone-700"
                        )} />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest">
                  {format(new Date(review.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </span>
              </div>
              <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
                {review.comment}
              </p>
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mt-4">
                  {review.images.map((img, i) => (
                    <img key={i} src={img} alt="" className="h-16 w-16 rounded-xl object-cover border border-stone-100 dark:border-stone-800" />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
