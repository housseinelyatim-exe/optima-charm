-- Fix stock reduction trigger to also update the updated_at timestamp
-- This ensures that product cache invalidation strategies that rely on timestamps work correctly

-- Drop and recreate the function to update stock AND updated_at
CREATE OR REPLACE FUNCTION public.reduce_product_stock()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only reduce stock if product_id is not null
  IF NEW.product_id IS NOT NULL THEN
    UPDATE products
    SET 
      stock = stock - NEW.quantity,
      updated_at = now()  -- Explicitly update the timestamp
    WHERE id = NEW.product_id;
    
    -- Optionally check if stock went negative and log a warning
    PERFORM 1
    FROM products
    WHERE id = NEW.product_id AND stock < 0;
    
    IF FOUND THEN
      RAISE WARNING 'Product % stock is now negative: %', NEW.product_id, (SELECT stock FROM products WHERE id = NEW.product_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the restore stock function to also update updated_at
CREATE OR REPLACE FUNCTION public.restore_product_stock_on_cancel()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- If order status changes to 'cancelled', restore the stock
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Restore stock for all items in this order
    UPDATE products p
    SET 
      stock = stock + oi.quantity,
      updated_at = now()  -- Explicitly update the timestamp
    FROM order_items oi
    WHERE oi.order_id = NEW.id 
      AND oi.product_id = p.id
      AND oi.product_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$;
