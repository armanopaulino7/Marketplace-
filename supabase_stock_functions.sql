-- Function to decrement product stock
CREATE OR REPLACE FUNCTION public.decrement_product_stock(product_id_param UUID, amount_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.produtos
    SET quantity = quantity - amount_param
    WHERE id = product_id_param AND quantity >= amount_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Estoque insuficiente para o produto %', product_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment product stock
CREATE OR REPLACE FUNCTION public.increment_product_stock(product_id_param UUID, amount_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.produtos
    SET quantity = quantity + amount_param
    WHERE id = product_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
