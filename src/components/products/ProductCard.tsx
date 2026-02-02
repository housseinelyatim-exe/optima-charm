import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import type { Product } from "@/hooks/useProducts";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  const inStock = product.stock > 0;
  const mainImage = product.images?.[0] || "/placeholder.svg";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inStock) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: mainImage,
      });
    }
  };

  return (
    <Link to={`/produit/${product.slug}`}>
      <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="relative aspect-square overflow-hidden bg-secondary flex items-center justify-center p-4">
          <img
            src={mainImage}
            alt={product.name}
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
          {!inStock && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="destructive" className="text-sm">
                Rupture de stock
              </Badge>
            </div>
          )}
          {inStock && (
            <Button
              size="icon"
              className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardContent className="p-4">
          <div className="space-y-1">
            {product.category && (
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {product.category.name}
              </p>
            )}
            <h3 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="font-semibold text-primary">
              {product.price.toFixed(2)} TND
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
