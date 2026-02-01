import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { LatestProductsSection } from "@/components/home/LatestProductsSection";
import { CTASection } from "@/components/home/CTASection";
import { BrandsCarousel } from "@/components/home/BrandsCarousel";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <CategoriesSection />
      <LatestProductsSection />
      <CTASection />
      <BrandsCarousel />
    </Layout>
  );
};

export default Index;
