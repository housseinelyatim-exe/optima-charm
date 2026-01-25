-- Temporarily disable RLS, then re-enable to force refresh
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;

-- Recreate policies with explicit anon role
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;

CREATE POLICY "Anon can create orders" 
ON public.orders 
FOR INSERT 
TO anon
WITH CHECK (true);

CREATE POLICY "Auth can create orders" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anon can create order items" 
ON public.order_items 
FOR INSERT 
TO anon
WITH CHECK (true);

CREATE POLICY "Auth can create order items" 
ON public.order_items 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';