-- ============================================================================
-- COMPLETE REBUILD OF STOCK MANAGEMENT SYSTEM
-- ============================================================================

-- Step 1: Drop all existing triggers and functions
DROP TRIGGER IF EXISTS reduce_stock_on_order ON public.order_items;
DROP TRIGGER IF EXISTS restore_stock_on_cancel ON public.orders;
DROP FUNCTION IF EXISTS public.reduce_product_stock() CASCADE;
DROP FUNCTION IF EXISTS public.restore_product_stock_on_cancel() CASCADE;
DROP FUNCTION IF EXISTS public.create_order_item(UUID, UUID, TEXT, INTEGER, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.create_order(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, NUMERIC) CASCADE;

-- ============================================================================
-- PART 1: Stock Reduction Function (Fires on Order Item Insert)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reduce_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_stock INTEGER;
  v_new_stock INTEGER;
  v_product_name TEXT;
BEGIN
  -- Only process if product_id is provided
  IF NEW.product_id IS NULL THEN
    RAISE NOTICE 'Order item % has no product_id, skipping stock reduction', NEW.id;
    RETURN NEW;
  END IF;

  -- Get current stock and product name
  SELECT stock, name INTO v_old_stock, v_product_name
  FROM public.products
  WHERE id = NEW.product_id;

  -- Check if product exists
  IF NOT FOUND THEN
    RAISE WARNING 'Product % not found for order item %', NEW.product_id, NEW.id;
    RETURN NEW;
  END IF;

  -- Reduce stock and update timestamp
  UPDATE public.products
  SET 
    stock = stock - NEW.quantity,
    updated_at = NOW()
  WHERE id = NEW.product_id
  RETURNING stock INTO v_new_stock;

  -- Log the change
  RAISE NOTICE 'Stock reduced for product "%" (ID: %): % -> % (quantity: %)',
    v_product_name, NEW.product_id, v_old_stock, v_new_stock, NEW.quantity;

  -- Warn if stock is negative
  IF v_new_stock < 0 THEN
    RAISE WARNING 'Product "%" (ID: %) stock is NEGATIVE: %', 
      v_product_name, NEW.product_id, v_new_stock;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for stock reduction
CREATE TRIGGER reduce_stock_on_order
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.reduce_product_stock();

COMMENT ON FUNCTION public.reduce_product_stock() IS 
  'Automatically reduces product stock when order items are inserted';

-- ============================================================================
-- PART 2: Stock Restoration Function (Fires on Order Cancellation)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.restore_product_stock_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_restored_count INTEGER := 0;
BEGIN
  -- Only restore stock if order is being cancelled
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Continue with stock restoration
  ELSE
    RETURN NEW;
  END IF;

  RAISE NOTICE 'Order % is being cancelled, restoring stock', NEW.order_number;

  -- Restore stock for all items in this order
  FOR v_item IN 
    SELECT oi.product_id, oi.quantity, p.name as product_name, p.stock as current_stock
    FROM public.order_items oi
    LEFT JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = NEW.id
    AND oi.product_id IS NOT NULL
  LOOP
    -- Restore the stock
    UPDATE public.products
    SET 
      stock = stock + v_item.quantity,
      updated_at = NOW()
    WHERE id = v_item.product_id;

    v_restored_count := v_restored_count + 1;

    RAISE NOTICE 'Restored % units of "%" (current stock: % -> %)',
      v_item.quantity, v_item.product_name, v_item.current_stock, v_item.current_stock + v_item.quantity;
  END LOOP;

  RAISE NOTICE 'Stock restoration complete for order %. % products updated.', 
    NEW.order_number, v_restored_count;

  RETURN NEW;
END;
$$;

-- Create trigger for stock restoration
CREATE TRIGGER restore_stock_on_cancel
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (OLD.status != 'cancelled' AND NEW.status = 'cancelled')
  EXECUTE FUNCTION public.restore_product_stock_on_cancel();

COMMENT ON FUNCTION public.restore_product_stock_on_cancel() IS 
  'Automatically restores product stock when orders are cancelled';

-- ============================================================================
-- PART 3: Create Order RPC Function
-- ============================================================================

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
AS $$
BEGIN
  RAISE NOTICE 'Creating order for customer: %', p_customer_name;
  
  RETURN QUERY
  INSERT INTO public.orders (
    customer_name, 
    customer_phone, 
    customer_address,
    delivery_method, 
    notes, 
    total, 
    coupon_code, 
    discount_amount
  )
  VALUES (
    p_customer_name, 
    p_customer_phone, 
    p_customer_address,
    p_delivery_method, 
    p_notes, 
    p_total, 
    p_coupon_code, 
    p_discount_amount
  )
  RETURNING orders.id, orders.order_number;
  
  RAISE NOTICE 'Order created successfully';
END;
$$;

COMMENT ON FUNCTION public.create_order IS 
  'Creates a new order, bypassing RLS for guest checkout';

-- ============================================================================
-- PART 4: Create Order Item RPC Function (CRITICAL - THIS TRIGGERS STOCK REDUCTION)
-- ============================================================================

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
AS $$
DECLARE
  v_order_number TEXT;
  v_current_stock INTEGER;
BEGIN
  -- Get order number for logging
  SELECT order_number INTO v_order_number
  FROM public.orders
  WHERE id = p_order_id;

  RAISE NOTICE 'Creating order item for order %: product=%, quantity=%', 
    v_order_number, p_product_name, p_quantity;

  -- Insert order item (this will trigger reduce_product_stock)
  INSERT INTO public.order_items (
    order_id, 
    product_id, 
    product_name, 
    quantity, 
    price_at_purchase
  )
  VALUES (
    p_order_id, 
    p_product_id, 
    p_product_name, 
    p_quantity, 
    p_price_at_purchase
  );

  RAISE NOTICE 'Order item created successfully for order %', v_order_number;
  
  -- Verify stock was reduced (for debugging)
  IF p_product_id IS NOT NULL THEN
    SELECT stock INTO v_current_stock
    FROM public.products
    WHERE id = p_product_id;
    
    RAISE NOTICE 'Current stock for product % is now: %', p_product_id, v_current_stock;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.create_order_item IS 
  'Creates an order item and automatically triggers stock reduction via trigger';

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.create_order TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_item TO anon, authenticated;

-- ============================================================================
-- Verification Queries (for testing)
-- ============================================================================

-- To test manually:
-- 1. Check a product's stock:
--    SELECT id, name, stock FROM products WHERE slug = 'your-product-slug';
--
-- 2. Create a test order item:
--    SELECT create_order_item(
--      'order-id'::uuid, 
--      'product-id'::uuid, 
--      'Test Product', 
--      1, 
--      10.00
--    );
--
-- 3. Check stock again:
--    SELECT id, name, stock FROM products WHERE slug = 'your-product-slug';
--
-- 4. Check logs in Supabase Dashboard > Database > Logs
