import { Link } from "react-router-dom";
import { ArrowRight, Glasses, Sun, Eye, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCategories } from "@/hooks/useProducts";

const categoryIcons: Record<string, React.ReactNode> = {
  "lunettes-vue": <Glasses className="h-8 w-8" />,
  "lunettes-soleil": <Sun className="h-8 w-8" />,
  "lentilles": <Eye className="h-8 w-8" />,
  "accessoires": <Package className="h-8 w-8" />,
};

export function CategoriesSection() {
  const { data: categories } = useCategories();

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Nos Catégories
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explorez notre sélection de lunettes et accessoires pour tous vos besoins visuels
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories?.map((category) => (
            <Link key={category.id} to={`/boutique?category=${category.slug}`}>
              <Card className="group h-full border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    {categoryIcons[category.slug] || <Package className="h-8 w-8" />}
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Voir plus <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
