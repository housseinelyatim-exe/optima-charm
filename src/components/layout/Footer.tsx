import { Link } from "react-router-dom";
import { Facebook, Instagram, Phone, Mail, MapPin } from "lucide-react";
import optimaLogo from "@/assets/optima-logo.png";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <img
              src={optimaLogo}
              alt="Optima Optique"
              className="h-12 w-auto brightness-0 invert"
            />
            <p className="text-sm text-primary-foreground/80">
              Votre opticien de confiance au Krib. Découvrez notre collection de
              lunettes de vue et de soleil de grandes marques.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  to="/boutique"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Boutique
                </Link>
              </li>
              <li>
                <Link
                  to="/boutique?category=lunettes-vue"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Lunettes de Vue
                </Link>
              </li>
              <li>
                <Link
                  to="/boutique?category=lunettes-soleil"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Lunettes de Soleil
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="text-primary-foreground/80">
                  Le Krib, Siliana, Tunisie
                </span>
              </li>
              <li>
                <a
                  href="tel:+21600000000"
                  className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span>+216 XX XXX XXX</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@optima-optique.tn"
                  className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>contact@optima-optique.tn</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold mb-4">Suivez-nous</h3>
            <div className="flex gap-4">
              <a
                href="https://facebook.com/optimaoptique"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/optima_optique_krib"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
          <p>
            © {new Date().getFullYear()} Optima Optique by Emina Bettaher. Tous
            droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
