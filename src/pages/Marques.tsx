import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProductGrid } from "@/components/products/ProductGrid";
import { useProductsByBrand, useBrands } from "@/hooks/useProducts";

const Marques = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: products, isLoading } = useProductsByBrand(slug);
  const { data: brands } = useBrands();
  
  const currentBrand = brands?.find(b => b.slug === slug);

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            {currentBrand?.name || "Marque"}
          </h1>
          <p className="text-muted-foreground">
            {currentBrand?.description || `Découvrez notre collection ${currentBrand?.name}`}
          </p>
        </div>

        {/* Products grid */}
        <ProductGrid products={products || []} isLoading={isLoading} />

        {/* Results count */}
        {!isLoading && products && (
          <p className="text-sm text-muted-foreground text-center mt-8">
            {products.length} produit{products.length !== 1 ? "s" : ""} trouvé{products.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </Layout>
  );
};

export default Marques;
