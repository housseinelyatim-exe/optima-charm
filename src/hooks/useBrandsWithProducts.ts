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
      // Get all active brands
      const { data: brandsData, error: brandsError } = await supabase
        .from("brands")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (brandsError) throw brandsError;

      // For each brand, count active products
      const brandsWithCounts = await Promise.all(
        (brandsData || []).map(async (brand) => {
          const { count } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("brand_id", brand.id)
            .eq("is_published", true);

          return {
            ...brand,
            product_count: count || 0,
          };
        })
      );

      // Filter out brands with 0 products
      return brandsWithCounts.filter(brand => brand.product_count > 0) as Brand[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
