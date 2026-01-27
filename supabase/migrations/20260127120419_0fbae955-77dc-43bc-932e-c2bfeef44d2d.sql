-- Function to reduce stock when order item is inserted
CREATE OR REPLACE FUNCTION public.reduce_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip if product_id is NULL (custom/deleted products)
  IF NEW.product_id IS NULL THEN
    RAISE LOG 'Skipping stock reduction: product_id is NULL for order_item %', NEW.id;
    RETURN NEW;
  END IF;

  -- Reduce stock
  UPDATE products
  SET 
    stock = stock - NEW.quantity,
    updated_at = now()
  WHERE id = NEW.product_id;

  RAISE LOG 'Stock reduced by % for product %', NEW.quantity, NEW.product_id;
  
  RETURN NEW;
END;
$$;

-- Function to restore stock when order is cancelled
CREATE OR REPLACE FUNCTION public.restore_product_stock_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  restored_count INTEGER := 0;
BEGIN
  -- Loop through all order items and restore stock
  FOR item IN 
    SELECT product_id, quantity 
    FROM order_items 
    WHERE order_id = NEW.id AND product_id IS NOT NULL
  LOOP
    UPDATE products
    SET 
      stock = stock + item.quantity,
      updated_at = now()
    WHERE id = item.product_id;
    
    restored_count := restored_count + 1;
  END LOOP;

  RAISE LOG 'Stock restored for % items in cancelled order %', restored_count, NEW.id;
  
  RETURN NEW;
END;
$$;

-- Trigger to reduce stock after order item insert
DROP TRIGGER IF EXISTS reduce_stock_on_order ON order_items;
CREATE TRIGGER reduce_stock_on_order
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION reduce_product_stock();

-- Trigger to restore stock when order is cancelled
DROP TRIGGER IF EXISTS restore_stock_on_cancel ON orders;
CREATE TRIGGER restore_stock_on_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM 'cancelled' AND NEW.status = 'cancelled')
  EXECUTE FUNCTION restore_product_stock_on_cancel();