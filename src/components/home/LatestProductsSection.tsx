import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/products/ProductGrid";
import { useLatestProducts } from "@/hooks/useProducts";

export function LatestProductsSection() {
  const { data: products, isLoading } = useLatestProducts(8);

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Nouveautés
            </h2>
            <p className="text-muted-foreground">
              Découvrez nos dernières arrivées
            </p>
          </div>
          <Link to="/boutique">
            <Button variant="outline" className="gap-2">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <ProductGrid products={products} isLoading={isLoading} />
      </div>
    </section>
  );
}
