import { Instagram } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface InstagramPost {
  id: string;
  image_url: string;
  alt_text: string;
  display_order: number;
}

export function InstagramSection() {
  const { data: settings } = useSettings();
  const instagramUrl = settings?.instagram_url || "https://instagram.com";

  const { data: posts, isLoading } = useQuery({
    queryKey: ["instagram-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instagram_posts")
        .select("id, image_url, alt_text, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(6);

      if (error) throw error;
      return data as InstagramPost[];
    },
  });

  // Don't render section if no posts
  if (!isLoading && (!posts || posts.length === 0)) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white mb-4">
            <Instagram className="h-5 w-5" />
            <span className="font-medium">@optima_optique_krib</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Suivez-nous sur Instagram
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Découvrez nos dernières publications et restez connectés avec notre boutique
          </p>
        </div>

        {/* Instagram Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-8">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square rounded-xl" />
              ))
            : posts?.map((post, index) => (
                <a
                  key={post.id}
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-xl animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <img
                    src={post.image_url}
                    alt={post.alt_text}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                    <Instagram className="h-6 w-6 text-white" />
                  </div>
                  {/* Gradient Border Effect */}
                  <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-white/30 transition-colors duration-300" />
                </a>
              ))}
        </div>

        {/* CTA Button */}
        <div className="text-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 text-white border-0"
            >
              <Instagram className="h-5 w-5" />
              Voir plus sur Instagram
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
