import { Phone, Mail, MapPin, Clock, Facebook, Instagram } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";

const Contact = () => {
  const { data: settings } = useSettings();

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Contactez-Nous
            </h1>
            <p className="text-muted-foreground text-lg">
              Notre équipe est à votre disposition pour répondre à toutes vos questions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Téléphone</h3>
                  <a
                    href={`tel:${settings?.shop_phone?.replace(/\s/g, "")}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {settings?.shop_phone || "+216 XX XXX XXX"}
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">
                    Appel direct - cliquez pour appeler
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <a
                    href={`mailto:${settings?.shop_email}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {settings?.shop_email || "contact@optima-optique.tn"}
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nous répondons sous 24h
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Adresse</h3>
                  <p className="text-muted-foreground">
                    {settings?.shop_address || "Le Krib, Siliana, Tunisie"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Venez nous rendre visite
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Horaires d'ouverture</h3>
                  <p className="text-muted-foreground">
                    {settings?.work_hours_weekdays || "Lundi - Samedi: 9h00 - 19h00"}
                  </p>
                  <p className="text-muted-foreground">
                    {settings?.work_hours_weekend || "Dimanche: Fermé"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Social links */}
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Suivez-nous</h2>
            <div className="flex justify-center gap-4">
              <a
                href={settings?.facebook_url || "https://facebook.com/optimaoptique"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="gap-2">
                  <Facebook className="h-5 w-5" />
                  Facebook
                </Button>
              </a>
              <a
                href={settings?.instagram_url || "https://instagram.com/optima_optique_krib"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="gap-2">
                  <Instagram className="h-5 w-5" />
                  Instagram
                </Button>
              </a>
            </div>
          </div>

          {/* Google Maps */}
          <div className="mt-12">
            <div className="aspect-video rounded-lg overflow-hidden border">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3194.8876969850396!2d9.052694!3d36.326841!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd9b33e4b7e65f%3A0x5c7f9e0a2b8b9c8d!2sLe%20Krib%2C%20Tunisia!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Optima Optique - Le Krib, Siliana"
              />
            </div>
            <div className="mt-4 text-center">
              <a
                href="https://maps.app.goo.gl/8S2MnZaMM7KudFceA"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <MapPin className="h-4 w-4" />
                Ouvrir dans Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
