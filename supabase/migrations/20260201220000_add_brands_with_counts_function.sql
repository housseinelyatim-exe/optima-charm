-- Create function to get brands with product counts
CREATE OR REPLACE FUNCTION get_brands_with_product_counts(only_active boolean DEFAULT true)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  logo_url text,
  domain text,
  description text,
  display_order integer,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  product_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.slug,
    b.logo_url,
    b.domain,
    b.description,
    b.display_order,
    b.is_active,
    b.created_at,
    b.updated_at,
    COUNT(p.id) AS product_count
  FROM brands b
  LEFT JOIN products p ON p.brand_id = b.id AND p.is_published = true
  WHERE (NOT only_active OR b.is_active = true)
  GROUP BY b.id
  ORDER BY b.display_order;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION get_brands_with_product_counts(boolean) TO authenticated, anon;
