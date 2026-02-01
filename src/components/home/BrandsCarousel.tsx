import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

interface Brand {
  id: string;
  name: string;
  logo_url: string;
  display_order: number;
}

export function BrandsCarousel() {
  const { data: brands, isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Brand[];
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

  if (!brands || brands.length === 0) {
    return null;
  }

  // Duplicate brands for infinite scroll effect
  const duplicatedBrands = [...brands, ...brands];

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
                  className="flex-shrink-0 w-32 md:w-40 h-20 md:h-24 p-4 flex items-center justify-center bg-background hover:shadow-lg transition-shadow duration-300"
                >
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<span class="text-sm font-medium text-muted-foreground">${brand.name}</span>`;
                      }
                    }}
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
