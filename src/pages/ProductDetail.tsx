import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingBag, Check, XCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, error } = useProduct(slug || "");
  const { addItem } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 md:py-12">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <Skeleton className="aspect-square" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Produit non trouvé</h1>
          <p className="text-muted-foreground mb-8">
            Le produit que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <Link to="/boutique">
            <Button>Retour à la boutique</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const images = product.images?.length ? product.images : ["/placeholder.svg"];
  const inStock = product.stock > 0;

  const handleAddToCart = () => {
    if (!inStock) return;

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: images[0],
      });
    }

    toast({
      title: "Ajouté au panier",
      description: `${quantity}x ${product.name} ajouté au panier`,
    });
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Back button */}
        <Link
          to="/boutique"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la boutique
        </Link>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square max-h-[280px] sm:max-h-[350px] md:max-h-[450px] mx-auto w-full max-w-[280px] sm:max-w-[350px] md:max-w-[450px] overflow-hidden rounded-lg bg-secondary flex items-center justify-center p-4 md:p-6">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-md overflow-hidden border-2 transition-colors snap-start ${
                      selectedImage === index
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-6">
            {product.category && (
              <Link to={`/boutique?category=${product.category.slug}`}>
                <Badge variant="secondary">{product.category.name}</Badge>
              </Link>
            )}

            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                {product.name}
              </h1>
              <p className="text-2xl font-semibold text-primary">
                {product.price.toFixed(2)} TND
              </p>
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2">
              {product.stock === 0 ? (
                <>
                  <XCircle className="h-4 w-4 text-destructive" />
                  <Badge variant="destructive">Rupture de stock</Badge>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-success font-medium">En stock</span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p>{product.description}</p>
              </div>
            )}

            {/* Quantity and add to cart */}
            {inStock && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantité:</span>
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-r-none"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-l-none"
                      onClick={() =>
                        setQuantity((q) => Math.min(product.stock, q + 1))
                      }
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleAddToCart}
                >
                  <ShoppingBag className="h-5 w-5" />
                  Ajouter au panier
                </Button>
              </div>
            )}

            {!inStock && (
              <div className="pt-4 border-t">
                <p className="text-muted-foreground text-sm">
                  Ce produit est actuellement en rupture de stock. Contactez-nous
                  pour plus d'informations.
                </p>
                <Link to="/contact" className="mt-4 inline-block">
                  <Button variant="outline">Nous contacter</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
