import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

export async function generateSitemap(): Promise<string> {
  const baseUrl = "https://optima-optique.com";
  const today = new Date().toISOString().split('T')[0];
  
  const urls: SitemapUrl[] = [];

  // Static pages
  urls.push({
    loc: `${baseUrl}/`,
    lastmod: today,
    changefreq: "daily",
    priority: "1.0",
  });

  urls.push({
    loc: `${baseUrl}/produits`,
    lastmod: today,
    changefreq: "daily",
    priority: "0.9",
  });

  urls.push({
    loc: `${baseUrl}/contact`,
    lastmod: today,
    changefreq: "monthly",
    priority: "0.7",
  });

  // Fetch active products
  const { data: products } = await supabase
    .from("products")
    .select("id, name, updated_at")
    .eq("is_active", true);

  if (products) {
    products.forEach((product) => {
      urls.push({
        loc: `${baseUrl}/produits/${product.id}`,
        lastmod: product.updated_at?.split('T')[0] || today,
        changefreq: "weekly",
        priority: "0.8",
      });
    });
  }

  // Fetch active categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, updated_at")
    .eq("is_active", true);

  if (categories) {
    categories.forEach((category) => {
      urls.push({
        loc: `${baseUrl}/categories/${category.id}`,
        lastmod: category.updated_at?.split('T')[0] || today,
        changefreq: "weekly",
        priority: "0.7",
      });
    });
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return xml;
}
