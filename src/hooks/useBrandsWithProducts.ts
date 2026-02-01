import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BrandFromRPC {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  domain: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_count: number;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  domain?: string | null;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  product_count: number;
}

export function useBrandsWithProducts() {
  return useQuery({
    queryKey: ["brands-with-products"],
    queryFn: async () => {
      // Use RPC function for efficient query
      const { data, error } = await supabase
        .rpc('get_brands_with_product_counts', { only_active: true });

      if (error) throw error;

      // Filter out brands with 0 products and map to Brand type
      return (data as BrandFromRPC[] || [])
        .filter(brand => (brand.product_count ?? 0) > 0)
        .map(brand => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          logo_url: brand.logo_url,
          domain: brand.domain,
          description: brand.description,
          display_order: brand.display_order,
          is_active: brand.is_active,
          product_count: brand.product_count,
        } as Brand));
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
