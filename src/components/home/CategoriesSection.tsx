import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import categoryMen from "@/assets/category-men.jpg";
import categoryWomen from "@/assets/category-women.jpg";
import categoryKids from "@/assets/category-kids.jpg";

const categories = [
  {
    id: "men",
    title: "Homme",
    subtitle: "Collection masculine",
    image: categoryMen,
    link: "/categorie?gender=homme",
  },
  {
    id: "women",
    title: "Femme",
    subtitle: "Collection féminine",
    image: categoryWomen,
    link: "/categorie?gender=femme",
  },
  {
    id: "kids",
    title: "Enfant",
    subtitle: "Collection enfant",
    image: categoryKids,
    link: "/categorie?gender=enfant",
  },
];

export function CategoriesSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Trouvez Votre Style
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Des lunettes pour toute la famille, alliant confort et élégance
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={category.link}
              className="group relative overflow-hidden rounded-2xl aspect-[3/4] animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${category.image})` }}
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                  <p className="text-white/70 text-sm mb-1">{category.subtitle}</p>
                  <h3 className="text-white text-2xl md:text-3xl font-display font-bold mb-3">
                    {category.title}
                  </h3>
                  <div className="flex items-center gap-2 text-white font-medium">
                    <span>Découvrir</span>
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" />
                  </div>
                </div>
              </div>
              
              {/* Hover Border Effect */}
              <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/30 rounded-2xl transition-all duration-300" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
