-- Create coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Everyone can read active coupons (for validation)
CREATE POLICY "Active coupons are publicly readable"
ON public.coupons
FOR SELECT
USING (is_active = true);

-- Only admins can manage coupons
CREATE POLICY "Admins can insert coupons"
ON public.coupons
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update coupons"
ON public.coupons
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete coupons"
ON public.coupons
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add coupon tracking to orders
ALTER TABLE public.orders 
ADD COLUMN coupon_code TEXT,
ADD COLUMN discount_amount NUMERIC DEFAULT 0;

-- Create function to validate and apply coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(coupon_code TEXT, order_total NUMERIC)
RETURNS TABLE (
  valid BOOLEAN,
  discount_type TEXT,
  discount_value NUMERIC,
  discount_amount NUMERIC,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coupon_record RECORD;
  calculated_discount NUMERIC;
BEGIN
  -- Find the coupon
  SELECT * INTO coupon_record
  FROM public.coupons c
  WHERE UPPER(c.code) = UPPER(validate_coupon.coupon_code)
    AND c.is_active = true;

  -- Check if coupon exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 'Code promo invalide'::TEXT;
    RETURN;
  END IF;

  -- Check validity dates
  IF coupon_record.valid_from > now() THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 'Ce code promo n''est pas encore actif'::TEXT;
    RETURN;
  END IF;

  IF coupon_record.valid_until IS NOT NULL AND coupon_record.valid_until < now() THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 'Ce code promo a expiré'::TEXT;
    RETURN;
  END IF;

  -- Check usage limit
  IF coupon_record.max_uses IS NOT NULL AND coupon_record.used_count >= coupon_record.max_uses THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 'Ce code promo a atteint sa limite d''utilisation'::TEXT;
    RETURN;
  END IF;

  -- Check minimum order amount
  IF order_total < coupon_record.min_order_amount THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 
      ('Montant minimum requis: ' || coupon_record.min_order_amount || ' TND')::TEXT;
    RETURN;
  END IF;

  -- Calculate discount
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

-- Function to increment coupon usage
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