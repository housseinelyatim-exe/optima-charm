import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";

export function HeroSection() {
  const { data: settings } = useSettings();

  const heroBackground = settings?.hero_background_image;

  return (
    <section className="relative min-h-[70vh] flex items-center bg-gradient-to-br from-secondary via-background to-secondary">
      {heroBackground ? (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBackground})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover bg-center opacity-5" />
      )}
      <div className="absolute inset-0 bg-background/60" />
      <div className="container relative py-20 md:py-32">
        <div className="max-w-2xl space-y-6 animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-foreground">
            {settings?.hero_tagline || "Votre vision, notre passion"}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            {settings?.hero_subtitle ||
              "Découvrez notre collection exclusive de lunettes de vue et de soleil"}
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link to="/boutique">
              <Button size="lg" className="gap-2">
                Voir la Collection
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline">
                Nous Contacter
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
