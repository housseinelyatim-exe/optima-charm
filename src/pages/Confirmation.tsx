import { useParams, Link } from "react-router-dom";
import { CheckCircle, Phone, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Confirmation = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  return (
    <Layout>
      <div className="container py-16 max-w-2xl">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-6" />

            <h1 className="text-3xl font-display font-bold mb-4">
              Commande Confirmée!
            </h1>

            <p className="text-muted-foreground mb-2">
              Merci pour votre commande. Nous avons bien reçu votre demande.
            </p>

            <div className="bg-secondary/50 rounded-lg p-4 my-6">
              <p className="text-sm text-muted-foreground">Numéro de commande</p>
              <p className="text-xl font-bold font-mono">{orderNumber}</p>
            </div>

            <div className="space-y-4 text-left bg-secondary/30 rounded-lg p-6 mb-8">
              <h2 className="font-semibold">Prochaines étapes</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </span>
                  Notre équipe va examiner votre commande et vous contacter pour confirmer les détails.
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </span>
                  Nous vous informerons quand votre commande sera prête (retrait) ou expédiée (livraison).
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </span>
                  Le paiement se fait à la réception de votre commande.
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:+21600000000">
                <Button variant="outline" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Nous appeler
                </Button>
              </a>
              <Link to="/boutique">
                <Button className="gap-2">
                  Continuer mes achats
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Confirmation;
