-- Corrigir a restrição de chave estrangeira na tabela de afiliações
-- Caso ela esteja apontando para a tabela errada ou precise ser reforçada

DO $$
BEGIN
    -- Remover a restrição antiga se existir (tentando nomes comuns)
    ALTER TABLE IF EXISTS public.affiliations DROP CONSTRAINT IF EXISTS affiliations_product_id_fkey;
    
    -- Adicionar a restrição correta apontando para 'produtos'
    ALTER TABLE public.affiliations 
    ADD CONSTRAINT affiliations_product_id_fkey 
    FOREIGN KEY (product_id) 
    REFERENCES public.produtos(id) 
    ON DELETE CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao atualizar restrição: %', SQLERRM;
END $$;
