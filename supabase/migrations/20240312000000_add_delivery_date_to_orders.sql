-- Adicionar coluna de data de entrega na tabela de pedidos
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
