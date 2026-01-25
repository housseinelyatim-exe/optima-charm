-- Create order function that bypasses RLS
CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_address TEXT DEFAULT NULL,
  p_delivery_method TEXT DEFAULT 'delivery',
  p_notes TEXT DEFAULT NULL,
  p_total NUMERIC DEFAULT 0,
  p_coupon_code TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT 0
)
RETURNS TABLE(id UUID, order_number TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO orders (
    customer_name, customer_phone, customer_address,
    delivery_method, notes, total, coupon_code, discount_amount
  )
  VALUES (
    p_customer_name, p_customer_phone, p_customer_address,
    p_delivery_method, p_notes, p_total, p_coupon_code, p_discount_amount
  )
  RETURNING orders.id, orders.order_number;
END;
$$;

-- Create order item function that bypasses RLS
CREATE OR REPLACE FUNCTION public.create_order_item(
  p_order_id UUID,
  p_product_id UUID DEFAULT NULL,
  p_product_name TEXT DEFAULT '',
  p_quantity INTEGER DEFAULT 1,
  p_price_at_purchase NUMERIC DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO order_items (
    order_id, product_id, product_name, quantity, price_at_purchase
  )
  VALUES (
    p_order_id, p_product_id, p_product_name, p_quantity, p_price_at_purchase
  );
END;
$$;

-- Grant execute permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.create_order TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_item TO anon, authenticated;