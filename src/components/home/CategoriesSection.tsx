import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import categoryMen from "@/assets/category-men.jpg";
import categoryWomen from "@/assets/category-women.jpg";
import categoryKids from "@/assets/category-kids.jpg";
import { Skeleton } from "@/components/ui/skeleton";

interface HomepageCategory {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  link: string;
  display_order: number;
}

const defaultImages: Record<string, string> = {
  men: categoryMen,
  women: categoryWomen,
  kids: categoryKids,
};

const fallbackCategories = [
  {
    id: "men",
    title: "Homme",
    subtitle: "Collection masculine",
    image_url: null,
    link: "/categorie?gender=homme",
    display_order: 1,
  },
  {
    id: "women",
    title: "Femme",
    subtitle: "Collection féminine",
    image_url: null,
    link: "/categorie?gender=femme",
    display_order: 2,
  },
  {
    id: "kids",
    title: "Enfant",
    subtitle: "Collection enfant",
    image_url: null,
    link: "/categorie?gender=enfant",
    display_order: 3,
  },
];

export function CategoriesSection() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["homepage-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as HomepageCategory[];
    },
  });

  const displayCategories = categories && categories.length > 0 ? categories : fallbackCategories;

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Trouvez Votre Style
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Des lunettes pour toute la famille, alliant confort et élégance
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[3/4] rounded-2xl" />
              ))
            : displayCategories.map((category, index) => {
                const imageUrl = category.image_url || defaultImages[category.id];
                return (
                  <Link
                    key={category.id}
                    to={category.link}
                    className="group relative overflow-hidden rounded-2xl aspect-[3/4] animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Background Image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url(${imageUrl})` }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-300" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                      <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                        <p className="text-white/70 text-sm mb-1">{category.subtitle}</p>
                        <h3 className="text-white text-2xl md:text-3xl font-display font-bold mb-3">
                          {category.title}
                        </h3>
                        <div className="flex items-center gap-2 text-white font-medium">
                          <span>Découvrir</span>
                          <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" />
                        </div>
                      </div>
                    </div>

                    {/* Hover Border Effect */}
                    <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/30 rounded-2xl transition-all duration-300" />
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}
