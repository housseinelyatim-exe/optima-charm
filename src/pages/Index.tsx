import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { LatestProductsSection } from "@/components/home/LatestProductsSection";
import { InstagramSection } from "@/components/home/InstagramSection";
import { CTASection } from "@/components/home/CTASection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <CategoriesSection />
      <LatestProductsSection />
      <InstagramSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
