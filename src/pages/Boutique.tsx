import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, X } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts, useCategories } from "@/hooks/useProducts";

const Boutique = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get("category") || undefined;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const { data: products, isLoading } = useProducts(categorySlug);
  const { data: categories } = useCategories();

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let result = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    return result;
  }, [products, searchQuery, sortBy]);

  const currentCategory = categories?.find((c) => c.slug === categorySlug);

  const clearCategory = () => {
    searchParams.delete("category");
    setSearchParams(searchParams);
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            {currentCategory ? currentCategory.name : "Notre Boutique"}
          </h1>
          <p className="text-muted-foreground">
            {currentCategory
              ? currentCategory.description
              : "Découvrez notre collection complète de lunettes et accessoires"}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Plus récent</SelectItem>
              <SelectItem value="price-asc">Prix croissant</SelectItem>
              <SelectItem value="price-desc">Prix décroissant</SelectItem>
              <SelectItem value="name">Nom A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category filter badges */}
        {currentCategory && (
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              {currentCategory.name}
              <button onClick={clearCategory}>
                <X className="h-3 w-3 ml-1" />
              </button>
            </Badge>
          </div>
        )}

        {/* Category links */}
        {!currentCategory && categories && (
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant="outline"
                size="sm"
                onClick={() => setSearchParams({ category: category.slug })}
              >
                {category.name}
              </Button>
            ))}
          </div>
        )}

        {/* Products grid */}
        <ProductGrid products={filteredProducts} isLoading={isLoading} />

        {/* Results count */}
        {!isLoading && filteredProducts && (
          <p className="text-sm text-muted-foreground text-center mt-8">
            {filteredProducts.length} produit
            {filteredProducts.length !== 1 ? "s" : ""} trouvé
            {filteredProducts.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </Layout>
  );
};

export default Boutique;
