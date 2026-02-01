import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  domain?: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  product_count?: number;
}

export function useBrandsWithProducts() {
  return useQuery({
    queryKey: ["brands-with-products"],
    queryFn: async () => {
      // Use RPC function for efficient query
      const { data, error } = await supabase
        .rpc('get_brands_with_product_counts', { only_active: true });

      if (error) throw error;

      // Filter out brands with 0 products
      return (data || []).filter(brand => brand.product_count > 0) as Brand[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
