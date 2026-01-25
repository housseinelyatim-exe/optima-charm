import { Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";

// Placeholder Instagram posts - these would ideally come from an API
const instagramPosts = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=400&fit=crop",
    alt: "Lunettes de soleil tendance",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=400&fit=crop",
    alt: "Collection été",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400&h=400&fit=crop",
    alt: "Lunettes optiques",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=400&h=400&fit=crop",
    alt: "Style urbain",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400&h=400&fit=crop",
    alt: "Accessoires mode",
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=400&h=400&fit=crop",
    alt: "Nouveautés boutique",
  },
];

export function InstagramSection() {
  const { data: settings } = useSettings();
  const instagramUrl = settings?.instagram_url || "https://instagram.com";

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
          {instagramPosts.map((post, index) => (
            <a
              key={post.id}
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-xl animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <img
                src={post.image}
                alt={post.alt}
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
