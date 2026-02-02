import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { LatestProductsSection } from "@/components/home/LatestProductsSection";
import { CTASection } from "@/components/home/CTASection";
import { BrandsCarousel } from "@/components/home/BrandsCarousel";
import { SEO } from "@/components/seo/SEO";
import { StructuredData } from "@/components/seo/StructuredData";

const Index = () => {
  return (
    <>
      <SEO 
        title="Optima Optique - Votre opticien de confiance au Krib"
        description="Découvrez notre collection exclusive de lunettes de vue et de soleil. Grandes marques, conseils personnalisés et livraison gratuite en Tunisie."
        canonical="https://optima-optique.com/"
      />
      <StructuredData type="Store" />
      <Layout>
        <HeroSection />
        <CategoriesSection />
        <LatestProductsSection />
        <CTASection />
        <BrandsCarousel />
      </Layout>
    </>
  );
};

export default Index;
