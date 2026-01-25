-- Drop existing policies and recreate with explicit public grant
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

-- Grant insert to public role (includes anon)
GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.order_items TO anon;

-- Also grant usage on sequences if order has auto-generated fields
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Create policies that work for anonymous users
CREATE POLICY "Public can create orders" 
ON public.orders 
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Public can create order items" 
ON public.order_items 
FOR INSERT 
TO public
WITH CHECK (true);

-- Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';