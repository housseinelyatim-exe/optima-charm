import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import heroBackgroundDefault from "@/assets/hero-background.jpg";
export function HeroSection() {
  const {
    data: settings
  } = useSettings();
  const heroBackground = settings?.hero_background_image || heroBackgroundDefault;
  return <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-[2s]" style={{
      backgroundImage: `url(${heroBackground})`
    }} />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-background/30" />
      
      {/* Animated Accent Elements */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-1/3 w-48 h-48 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{
      animationDelay: "1s"
    }} />
      
      {/* Content */}
      <div className="container relative z-10 py-20 md:py-32">
        <div className="max-w-2xl space-y-8">
          {/* Badge */}
          
          
          {/* Title with Staggered Animation */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold tracking-tight text-foreground animate-fade-in" style={{
          animationDelay: "0.1s"
        }}>
            {settings?.hero_tagline || "Votre vision, notre passion"}
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl animate-fade-in" style={{
          animationDelay: "0.2s"
        }}>
            {settings?.hero_subtitle || "Découvrez notre collection exclusive de lunettes de vue et de soleil"}
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 pt-4 animate-fade-in" style={{
          animationDelay: "0.3s"
        }}>
            <Link to="/categorie">
              <Button size="lg" className="gap-2 text-base px-8 py-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5">
                Voir la Collection
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="text-base px-8 py-6 backdrop-blur-sm bg-background/50 hover:bg-background/80 transition-all duration-300 hover:-translate-y-0.5">
                Nous Contacter
              </Button>
            </Link>
          </div>
          
          {/* Trust Badges */}
          <div className="flex items-center gap-8 pt-8 animate-fade-in" style={{
          animationDelay: "0.4s"
        }}>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg">🔒</span>
              </div>
              <div className="text-sm">
                <p className="font-medium">Paiement Sécurisé</p>
                <p className="text-muted-foreground">À la livraison</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg">🚚</span>
              </div>
              <div className="text-sm">
                <p className="font-medium">Livraison Rapide</p>
                <p className="text-muted-foreground">Partout en Tunisie</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-foreground/20 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-foreground/40 rounded-full animate-pulse" />
        </div>
      </div>
    </section>;
}