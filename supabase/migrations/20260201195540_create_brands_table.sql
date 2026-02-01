-- Create brands table
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    domain TEXT, -- Add domain field for Brandfetch
    logo_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Public can read active brands
CREATE POLICY "Anyone can view active brands"
ON public.brands
FOR SELECT
USING (is_active = true);

-- Admins can manage brands
CREATE POLICY "Admins can manage brands"
ON public.brands
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Insert default popular eyewear brands with domains
INSERT INTO public.brands (name, domain, logo_url, display_order) VALUES
('Ray-Ban', 'ray-ban.com', 'https://asset.brandfetch.io/idFdo8ulhr/idzj34qGQm.jpeg', 1),
('Oakley', 'oakley.com', 'https://asset.brandfetch.io/id20mQeCNq/idXDgGJCaj.jpeg', 2),
('Prada', 'prada.com', 'https://asset.brandfetch.io/idZXyMQQfW/id8pJC7gKu.svg', 3),
('Gucci', 'gucci.com', 'https://asset.brandfetch.io/id4ndmJn_d/idV4eHZcDW.svg', 4),
('Dolce & Gabbana', 'dolcegabbana.com', 'https://asset.brandfetch.io/idCXe4qvWF/id6QZg_1tP.svg', 5),
('Versace', 'versace.com', 'https://asset.brandfetch.io/id6UnhQ10E/idjFxHiB_X.svg', 6),
('Armani', 'armani.com', 'https://asset.brandfetch.io/idr7qG07l4/idS3FV8yJI.svg', 7),
('Tom Ford', 'tomford.com', 'https://asset.brandfetch.io/id3ULvwPyU/idg0X0q2Tb.svg', 8),
('Burberry', 'burberry.com', 'https://asset.brandfetch.io/idNqKx7bxB/idpR1eeOvQ.svg', 9),
('Chanel', 'chanel.com', 'https://asset.brandfetch.io/idAnDvEV7E/id0c73rJFx.svg', 10),
('Dior', 'dior.com', 'https://asset.brandfetch.io/idDDfurQqN/idg4_EWO0O.svg', 11),
('Carrera', 'carrera.com', 'https://asset.brandfetch.io/idw8xXNqvV/idxvJGJPq8.png', 12)
ON CONFLICT (name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_brands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER brands_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION update_brands_updated_at();
