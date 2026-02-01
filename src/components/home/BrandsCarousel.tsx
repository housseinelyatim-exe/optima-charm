import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export function BrandsCarousel() {
  const { data: brands, isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold">
              Nos Marques Partenaires
            </h2>
          </div>
          <div className="flex gap-6 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 w-32 bg-muted animate-pulse rounded-lg flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Filter brands that have a logo_url
  const brandsWithLogos = brands?.filter(brand => brand.logo_url) || [];

  if (brandsWithLogos.length === 0) {
    return null;
  }

  // Duplicate brands for infinite scroll effect
  const duplicatedBrands = [...brandsWithLogos, ...brandsWithLogos];

  return (
    <section className="py-12 md:py-16 bg-secondary/30 overflow-hidden">
      <div className="container">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
            Nos Marques Partenaires
          </h2>
          <p className="text-muted-foreground">
            Découvrez les plus grandes marques de lunettes
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Gradient overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-secondary/30 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-secondary/30 to-transparent z-10 pointer-events-none" />

          {/* Scrolling container */}
          <div className="overflow-hidden">
            <div className="flex gap-8 md:gap-12 animate-scroll-brands">
              {duplicatedBrands.map((brand, index) => (
                <Card
                  key={`${brand.id}-${index}`}
                  className="flex-shrink-0 w-32 md:w-40 h-20 md:h-24 p-4 flex items-center justify-center bg-foreground hover:shadow-lg transition-shadow duration-300 border-0"
                >
                  <img
                    src={brand.logo_url!}
                    alt={brand.name}
                    className="max-w-full max-h-full object-contain brightness-0 invert opacity-80 hover:opacity-100 transition-all duration-300"
                    loading="lazy"
                  />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
