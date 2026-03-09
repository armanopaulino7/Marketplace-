-- Adicionar pickup_address na tabela de produtos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pickup_address TEXT;

-- Comentário: O pickup_address é obrigatório para que o ADM saiba onde buscar o produto.
