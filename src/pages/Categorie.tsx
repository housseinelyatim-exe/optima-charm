import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, Glasses, Sun } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/hooks/useProducts";
import categoryMen from "@/assets/category-men.jpg";
import categoryWomen from "@/assets/category-women.jpg";
import categoryKids from "@/assets/category-kids.jpg";

const genderConfig = {
  homme: {
    title: "Collection Homme",
    subtitle: "Lunettes élégantes pour hommes",
    image: categoryMen,
    slugs: ["lunettes-optiques-homme", "lunettes-solaires-homme"],
  },
  femme: {
    title: "Collection Femme",
    subtitle: "Lunettes raffinées pour femmes",
    image: categoryWomen,
    slugs: ["lunettes-optiques-femme", "lunettes-solaires-femme"],
  },
  enfant: {
    title: "Collection Enfant",
    subtitle: "Lunettes colorées pour enfants",
    image: categoryKids,
    slugs: ["lunettes-optiques-enfant", "lunettes-solaires-enfant"],
  },
};

const typeConfig = {
  optiques: {
    label: "Lunettes Optiques",
    icon: Glasses,
    slugPart: "optiques",
  },
  solaires: {
    label: "Lunettes Solaires",
    icon: Sun,
    slugPart: "solaires",
  },
};

type GenderKey = keyof typeof genderConfig;
type TypeKey = keyof typeof typeConfig;

const Categorie = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const gender = (searchParams.get("gender") as GenderKey) || "homme";
  const type = searchParams.get("type") as TypeKey | null;

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const config = genderConfig[gender] || genderConfig.homme;

  // Fetch products based on gender and type
  const { data: products, isLoading } = useQuery({
    queryKey: ["products-by-gender", gender, type],
    queryFn: async () => {
      // Get category slugs based on gender and type
      let categorySlugs: string[] = [];
      
      if (type === "optiques") {
        categorySlugs = [`lunettes-optiques-${gender}`];
      } else if (type === "solaires") {
        categorySlugs = [`lunettes-solaires-${gender}`];
      } else {
        categorySlugs = config.slugs;
      }

      // First get category IDs
      const { data: categories } = await supabase
        .from("categories")
        .select("id")
        .in("slug", categorySlugs);

      if (!categories || categories.length === 0) return [];

      const categoryIds = categories.map((c) => c.id);

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(id, name, slug)
        `)
        .eq("is_published", true)
        .in("category_id", categoryIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });

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

  const setGender = (g: GenderKey) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("gender", g);
    setSearchParams(newParams);
  };

  const setType = (t: TypeKey | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (t) {
      newParams.set("type", t);
    } else {
      newParams.delete("type");
    }
    setSearchParams(newParams);
  };

  return (
    <Layout>
      {/* Hero Banner */}
      <div className="relative h-[40vh] min-h-[300px] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${config.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
        <div className="container relative z-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2 animate-fade-in">
            {config.title}
          </h1>
          <p className="text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {config.subtitle}
          </p>
        </div>
      </div>

      <div className="container py-8 md:py-12">
        {/* Gender Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(Object.keys(genderConfig) as GenderKey[]).map((g) => (
            <Button
              key={g}
              variant={gender === g ? "default" : "outline"}
              onClick={() => setGender(g)}
              className="capitalize"
            >
              {g}
            </Button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button
            variant={!type ? "secondary" : "ghost"}
            onClick={() => setType(null)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Tous
          </Button>
          {(Object.keys(typeConfig) as TypeKey[]).map((t) => {
            const Icon = typeConfig[t].icon;
            return (
              <Button
                key={t}
                variant={type === t ? "secondary" : "ghost"}
                onClick={() => setType(t)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {typeConfig[t].label}
              </Button>
            );
          })}
        </div>

        {/* Search and Sort */}
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

        {/* Active Filters */}
        {type && (
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              {typeConfig[type].label}
              <button onClick={() => setType(null)}>
                <X className="h-3 w-3 ml-1" />
              </button>
            </Badge>
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

export default Categorie;
