-- Fix the create_order_item function to ensure triggers fire correctly
-- by removing the restrictive search_path setting
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
-- Removed restrictive search_path to allow triggers to execute properly
AS $$
DECLARE
  v_old_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  -- Insert order item (this should trigger reduce_stock_on_order)
  INSERT INTO order_items (
    order_id, product_id, product_name, quantity, price_at_purchase
  )
  VALUES (
    p_order_id, p_product_id, p_product_name, p_quantity, p_price_at_purchase
  );
  
  -- Add verification logging (optional, helps debug)
  IF p_product_id IS NOT NULL THEN
    SELECT stock INTO v_new_stock FROM products WHERE id = p_product_id;
    RAISE NOTICE 'Stock after insert for product %: %', p_product_id, v_new_stock;
  END IF;
END;
$$;

-- Ensure permissions are maintained
GRANT EXECUTE ON FUNCTION public.create_order_item TO anon, authenticated;

-- Also update the reduce_product_stock function with better logging
CREATE OR REPLACE FUNCTION public.reduce_product_stock()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  -- Only reduce stock if product_id is not null
  IF NEW.product_id IS NOT NULL THEN
    -- Get old stock for logging
    SELECT stock INTO v_old_stock FROM products WHERE id = NEW.product_id;
    
    -- Update stock and updated_at timestamp
    UPDATE products
    SET 
      stock = stock - NEW.quantity,
      updated_at = NOW()
    WHERE id = NEW.product_id;
    
    -- Get new stock for verification
    SELECT stock INTO v_new_stock FROM products WHERE id = NEW.product_id;
    
    -- Log the change
    RAISE NOTICE 'Stock reduced for product %: % -> % (reduced by %)', 
      NEW.product_id, v_old_stock, v_new_stock, NEW.quantity;
    
    -- Warn if stock is negative
    IF v_new_stock < 0 THEN
      RAISE WARNING 'Product % stock is now negative: %', NEW.product_id, v_new_stock;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger is properly configured
DROP TRIGGER IF EXISTS reduce_stock_on_order ON public.order_items;

CREATE TRIGGER reduce_stock_on_order
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.reduce_product_stock();
