-- Create brands table
CREATE TABLE public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  logo_url text,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add brand_id to products
ALTER TABLE public.products 
ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- RLS policies for brands
CREATE POLICY "Brands are publicly readable" 
ON public.brands 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert brands" 
ON public.brands 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update brands" 
ON public.brands 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete brands" 
ON public.brands 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert some common eyewear brands
INSERT INTO public.brands (name, slug, display_order) VALUES
  ('Ray-Ban', 'ray-ban', 1),
  ('Oakley', 'oakley', 2),
  ('Gucci', 'gucci', 3),
  ('Prada', 'prada', 4),
  ('Tom Ford', 'tom-ford', 5),
  ('Versace', 'versace', 6),
  ('Dior', 'dior', 7),
  ('Chanel', 'chanel', 8);