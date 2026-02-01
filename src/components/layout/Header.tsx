import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Phone, ShoppingBag, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/hooks/useCart";
import { useCategories, useBrands } from "@/hooks/useProducts";
import { useSettings } from "@/hooks/useSettings";
import optimaLogo from "@/assets/optima-logo.png";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { items } = useCart();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: settings } = useSettings();

  const phone = settings?.shop_phone || "+216 XX XXX XXX";

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href.split("?")[0]);
  };

  // Find lunettes optiques and solaires categories
  const lunettesOptiques = categories?.find(c => c.slug === "lunettes-optiques");
  const lunettesSolaires = categories?.find(c => c.slug === "lunettes-solaires");

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
        <nav className="hidden md:flex items-center gap-1">
          {/* Accueil */}
          <Link
            to="/"
            className={`px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
              isActive("/") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Accueil
          </Link>

          {/* Lunettes de Vue Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
                  location.search.includes("lunettes-optiques") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Lunettes de Vue
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-background z-50">
              <DropdownMenuItem asChild>
                <Link to="/boutique?category=lunettes-optiques" className="w-full">
                  Toutes les lunettes
                </Link>
              </DropdownMenuItem>
              {lunettesOptiques?.subcategories?.map((sub) => (
                <DropdownMenuItem key={sub.id} asChild>
                  <Link to={`/boutique?category=${sub.slug}`} className="w-full">
                    {sub.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Lunettes Solaires Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
                  location.search.includes("lunettes-solaires") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Lunettes Solaires
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-background z-50">
              <DropdownMenuItem asChild>
                <Link to="/boutique?category=lunettes-solaires" className="w-full">
                  Toutes les lunettes
                </Link>
              </DropdownMenuItem>
              {lunettesSolaires?.subcategories?.map((sub) => (
                <DropdownMenuItem key={sub.id} asChild>
                  <Link to={`/boutique?category=${sub.slug}`} className="w-full">
                    {sub.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Marques Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname.includes("/marques") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Marques
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-background z-50 max-h-64 overflow-y-auto">
              {brands?.map((brand) => (
                <DropdownMenuItem key={brand.id} asChild>
                  <Link to={`/marques/${brand.slug}`} className="w-full">
                    {brand.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Contact */}
          <Link
            to="/contact"
            className={`px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
              isActive("/contact") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Contact
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Phone - Desktop only */}
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Phone className="h-4 w-4" />
            <span>{phone}</span>
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
                  <Link
                    to="/"
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium transition-colors hover:text-primary"
                  >
                    Accueil
                  </Link>
                  
                  {/* Lunettes de Vue */}
                  <div className="space-y-2">
                    <Link
                      to="/boutique?category=lunettes-optiques"
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-medium transition-colors hover:text-primary"
                    >
                      Lunettes de Vue
                    </Link>
                    <div className="ml-4 space-y-1">
                      {lunettesOptiques?.subcategories?.map((sub) => (
                        <Link
                          key={sub.id}
                          to={`/boutique?category=${sub.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="block text-sm text-muted-foreground hover:text-primary"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Lunettes Solaires */}
                  <div className="space-y-2">
                    <Link
                      to="/boutique?category=lunettes-solaires"
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-medium transition-colors hover:text-primary"
                    >
                      Lunettes Solaires
                    </Link>
                    <div className="ml-4 space-y-1">
                      {lunettesSolaires?.subcategories?.map((sub) => (
                        <Link
                          key={sub.id}
                          to={`/boutique?category=${sub.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="block text-sm text-muted-foreground hover:text-primary"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Marques */}
                  <div className="space-y-2">
                    <span className="text-lg font-medium">Marques</span>
                    <div className="ml-4 space-y-1">
                      {brands?.slice(0, 6).map((brand) => (
                        <Link
                          key={brand.id}
                          to={`/marques/${brand.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="block text-sm text-muted-foreground hover:text-primary"
                        >
                          {brand.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <Link
                    to="/contact"
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium transition-colors hover:text-primary"
                  >
                    Contact
                  </Link>
                </nav>
                <div className="border-t pt-4">
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span>{phone}</span>
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
