-- Create brands table
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
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

-- Insert default popular eyewear brands
INSERT INTO public.brands (name, logo_url, display_order) VALUES
('Ray-Ban', 'https://logos-world.net/wp-content/uploads/2020/12/Ray-Ban-Logo.png', 1),
('Oakley', 'https://logos-world.net/wp-content/uploads/2020/12/Oakley-Logo.png', 2),
('Prada', 'https://logos-world.net/wp-content/uploads/2020/04/Prada-Logo.png', 3),
('Gucci', 'https://logos-world.net/wp-content/uploads/2020/04/Gucci-Logo.png', 4),
('Dolce & Gabbana', 'https://logos-world.net/wp-content/uploads/2020/09/Dolce-Gabbana-Logo.png', 5),
('Versace', 'https://logos-world.net/wp-content/uploads/2020/09/Versace-Logo.png', 6),
('Armani', 'https://logos-world.net/wp-content/uploads/2020/09/Armani-Logo.png', 7),
('Tom Ford', 'https://logos-world.net/wp-content/uploads/2021/02/Tom-Ford-Logo.png', 8),
('Burberry', 'https://logos-world.net/wp-content/uploads/2020/09/Burberry-Logo.png', 9),
('Chanel', 'https://logos-world.net/wp-content/uploads/2020/05/Chanel-Logo.png', 10),
('Dior', 'https://logos-world.net/wp-content/uploads/2020/09/Dior-Logo.png', 11),
('Carrera', 'https://1000logos.net/wp-content/uploads/2020/09/Carrera-Logo.png', 12)
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
