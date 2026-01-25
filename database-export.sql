-- =====================================================
-- OPTIMA OPTIQUE - DATABASE EXPORT SCRIPT
-- Execute this in your Supabase SQL Editor
-- =====================================================

-- 1. CREATE ENUM
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. CREATE TABLES

-- User Roles Table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Brands Table
CREATE TABLE public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Categories Table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.categories(id),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products Table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC NOT NULL,
    category_id UUID REFERENCES public.categories(id),
    brand_id UUID REFERENCES public.brands(id),
    stock INTEGER NOT NULL DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orders Table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT,
    delivery_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    total NUMERIC NOT NULL,
    coupon_code TEXT,
    discount_amount NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order Items Table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_purchase NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Coupons Table
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL, -- 'percentage' or 'fixed'
    discount_value NUMERIC NOT NULL,
    min_order_amount NUMERIC DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Settings Table
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Homepage Categories Table
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

-- Instagram Posts Table
CREATE TABLE public.instagram_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    alt_text TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. CREATE FUNCTIONS

-- Has Role Function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update Updated At Column Function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Generate Order Number Function
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.order_number = 'OPT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$;

-- Setup First Admin Function
CREATE OR REPLACE FUNCTION public.setup_first_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  
  IF admin_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (current_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN true;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = current_user_id AND role = 'admin') THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Validate Coupon Function
CREATE OR REPLACE FUNCTION public.validate_coupon(coupon_code TEXT, order_total NUMERIC)
RETURNS TABLE(valid BOOLEAN, discount_type TEXT, discount_value NUMERIC, discount_amount NUMERIC, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coupon_record RECORD;
  calculated_discount NUMERIC;
BEGIN
  SELECT * INTO coupon_record
  FROM public.coupons c
  WHERE UPPER(c.code) = UPPER(validate_coupon.coupon_code)
    AND c.is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 'Code promo invalide'::TEXT;
    RETURN;
  END IF;

  IF coupon_record.valid_from > now() THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 'Ce code promo n''est pas encore actif'::TEXT;
    RETURN;
  END IF;

  IF coupon_record.valid_until IS NOT NULL AND coupon_record.valid_until < now() THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 'Ce code promo a expiré'::TEXT;
    RETURN;
  END IF;

  IF coupon_record.max_uses IS NOT NULL AND coupon_record.used_count >= coupon_record.max_uses THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 'Ce code promo a atteint sa limite d''utilisation'::TEXT;
    RETURN;
  END IF;

  IF order_total < coupon_record.min_order_amount THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 
      ('Montant minimum requis: ' || coupon_record.min_order_amount || ' TND')::TEXT;
    RETURN;
  END IF;

  IF coupon_record.discount_type = 'percentage' THEN
    calculated_discount := ROUND((order_total * coupon_record.discount_value / 100), 2);
  ELSE
    calculated_discount := LEAST(coupon_record.discount_value, order_total);
  END IF;

  RETURN QUERY SELECT 
    true, 
    coupon_record.discount_type, 
    coupon_record.discount_value, 
    calculated_discount,
    'Code promo appliqué!'::TEXT;
END;
$$;

-- Increment Coupon Usage Function
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE UPPER(code) = UPPER(coupon_code);
END;
$$;

-- 4. CREATE TRIGGERS

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER generate_order_number_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_order_number();

-- 5. ENABLE RLS

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES

-- User Roles Policies
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Brands Policies
CREATE POLICY "Brands are publicly readable" ON public.brands
FOR SELECT USING (true);

CREATE POLICY "Admins can insert brands" ON public.brands
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update brands" ON public.brands
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete brands" ON public.brands
FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Categories Policies
CREATE POLICY "Categories are publicly readable" ON public.categories
FOR SELECT USING (true);

CREATE POLICY "Admins can insert categories" ON public.categories
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories" ON public.categories
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories" ON public.categories
FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Products Policies
CREATE POLICY "Published products are publicly readable" ON public.products
FOR SELECT USING ((is_published = true) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert products" ON public.products
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products" ON public.products
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products" ON public.products
FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Orders Policies
CREATE POLICY "Anyone can create orders" ON public.orders
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all orders" ON public.orders
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders" ON public.orders
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Order Items Policies
CREATE POLICY "Anyone can create order items" ON public.order_items
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all order items" ON public.order_items
FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Coupons Policies
CREATE POLICY "Active coupons are publicly readable" ON public.coupons
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can insert coupons" ON public.coupons
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update coupons" ON public.coupons
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete coupons" ON public.coupons
FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Settings Policies
CREATE POLICY "Settings are publicly readable" ON public.settings
FOR SELECT USING (true);

CREATE POLICY "Admins can insert settings" ON public.settings
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update settings" ON public.settings
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Homepage Categories Policies
CREATE POLICY "Homepage categories are publicly readable" ON public.homepage_categories
FOR SELECT USING (true);

CREATE POLICY "Admins can insert homepage categories" ON public.homepage_categories
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update homepage categories" ON public.homepage_categories
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete homepage categories" ON public.homepage_categories
FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Instagram Posts Policies
CREATE POLICY "Instagram posts are publicly readable" ON public.instagram_posts
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can insert instagram posts" ON public.instagram_posts
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update instagram posts" ON public.instagram_posts
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete instagram posts" ON public.instagram_posts
FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 7. INSERT DEFAULT SETTINGS
INSERT INTO public.settings (key, value) VALUES
('hero_tagline', 'Votre vision, notre passion'),
('hero_subtitle', 'Découvrez notre collection exclusive de lunettes de vue et de soleil'),
('hero_background_image', ''),
('shop_phone', '+216 52 998 615'),
('shop_email', 'aminabettaher7@gmail.com'),
('shop_address', 'Le Krib, Siliana, Tunisie'),
('facebook_url', 'https://www.facebook.com/profile.php?id=100063697894975'),
('instagram_url', 'https://instagram.com/optima_optique_krib'),
('work_hours_weekdays', 'Lundi - Samedi: 9h00 - 19h00'),
('work_hours_weekend', 'Dimanche: Fermé'),
('announcement_enabled', 'true'),
('announcement_text', '🚚 Livraison gratuite à partir de 100 TND !'),
('delivery_price', '8');

-- 8. INSERT DEFAULT HOMEPAGE CATEGORIES
INSERT INTO public.homepage_categories (id, title, subtitle, link, display_order) VALUES
('men', 'Homme', 'Collection masculine', '/categorie?gender=homme', 1),
('women', 'Femme', 'Collection féminine', '/categorie?gender=femme', 2),
('kids', 'Enfant', 'Collection enfant', '/categorie?gender=enfant', 3);

-- =====================================================
-- END OF SCRIPT
-- =====================================================
