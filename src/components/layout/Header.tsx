import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";
import optimaLogo from "@/assets/optima-logo.png";

const navigation = [
  { name: "Accueil", href: "/" },
  { name: "Boutique", href: "/boutique" },
  { name: "Lunettes de Vue", href: "/boutique?category=lunettes-vue" },
  { name: "Solaires", href: "/boutique?category=lunettes-soleil" },
  { name: "Contact", href: "/contact" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { items } = useCart();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href.split("?")[0]);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between md:h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src={optimaLogo}
            alt="Optima Optique"
            className="h-10 w-auto md:h-12"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(item.href)
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Phone - Desktop only */}
          <a
            href="tel:+21600000000"
            className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Phone className="h-4 w-4" />
            <span>+216 XX XXX XXX</span>
          </a>

          {/* Cart */}
          <Link to="/panier">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Button>
          </Link>

          {/* Mobile menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <div className="flex flex-col gap-6 mt-6">
                <Link to="/" onClick={() => setIsOpen(false)}>
                  <img
                    src={optimaLogo}
                    alt="Optima Optique"
                    className="h-10 w-auto"
                  />
                </Link>
                <nav className="flex flex-col gap-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`text-lg font-medium transition-colors hover:text-primary ${
                        isActive(item.href)
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
                <div className="border-t pt-4">
                  <a
                    href="tel:+21600000000"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span>+216 XX XXX XXX</span>
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
