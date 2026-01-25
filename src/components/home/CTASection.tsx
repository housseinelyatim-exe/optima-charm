import { Link } from "react-router-dom";
import { Phone, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              Visitez Notre Boutique
            </h2>
            <p className="text-primary-foreground/80 text-lg">
              Venez découvrir notre collection en magasin. Notre équipe d'experts
              vous accompagne dans le choix de vos lunettes.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="tel:+21600000000">
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  <Phone className="h-4 w-4" />
                  Appeler
                </Button>
              </a>
              <Link to="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Plus d'infos
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="bg-primary-foreground/10 border-0">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="h-12 w-12 rounded-full bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Adresse</h3>
                  <p className="text-primary-foreground/80">
                    Le Krib, Siliana, Tunisie
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary-foreground/10 border-0">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="h-12 w-12 rounded-full bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Horaires</h3>
                  <p className="text-primary-foreground/80">
                    Lun - Sam: 9h00 - 19h00
                    <br />
                    Dimanche: Fermé
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
