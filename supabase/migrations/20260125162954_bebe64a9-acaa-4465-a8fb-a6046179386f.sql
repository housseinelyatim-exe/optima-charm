-- Create a table for homepage category images
CREATE TABLE public.homepage_categories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  image_url TEXT,
  link TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories
CREATE POLICY "Homepage categories are publicly readable"
ON public.homepage_categories
FOR SELECT
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert homepage categories"
ON public.homepage_categories
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update homepage categories"
ON public.homepage_categories
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete homepage categories"
ON public.homepage_categories
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_homepage_categories_updated_at
BEFORE UPDATE ON public.homepage_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.homepage_categories (id, title, subtitle, image_url, link, display_order)
VALUES 
  ('men', 'Homme', 'Collection masculine', NULL, '/categorie?gender=homme', 1),
  ('women', 'Femme', 'Collection féminine', NULL, '/categorie?gender=femme', 2),
  ('kids', 'Enfant', 'Collection enfant', NULL, '/categorie?gender=enfant', 3);