-- Function to reduce product stock when order item is created
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
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
    
    -- Check if stock went negative (optional safety check)
    -- You can add validation here if needed
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on order_items table
DROP TRIGGER IF EXISTS reduce_stock_on_order ON public.order_items;

CREATE TRIGGER reduce_stock_on_order
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.reduce_product_stock();

-- Optional: Add a trigger to restore stock if order is cancelled
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
    SET stock = stock + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id 
      AND oi.product_id = p.id
      AND oi.product_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restore_stock_on_cancel ON public.orders;

CREATE TRIGGER restore_stock_on_cancel
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.restore_product_stock_on_cancel();
