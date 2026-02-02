import { Helmet } from "react-helmet";

interface ProductData {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  brand?: string;
  price: number;
  stock: number;
}

interface WebPageData {
  title?: string;
  description?: string;
  url?: string;
}

interface StructuredDataProps {
  type: "Store" | "Product" | "WebPage";
  data?: ProductData | WebPageData;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const getStructuredData = () => {
    switch (type) {
      case "Store":
        return {
          "@context": "https://schema.org",
          "@type": "Store",
          "name": "Optima Optique",
          "description": "Votre opticien de confiance au Krib - Lunettes de vue et de soleil",
          "url": "https://optima-optique.com",
          "telephone": "+216-XX-XXX-XXX",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Centre ville",
            "addressLocality": "Le Krib",
            "addressRegion": "Siliana",
            "postalCode": "6030",
            "addressCountry": "TN"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": "36.0",
            "longitude": "9.5"
          },
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
              "opens": "09:00",
              "closes": "18:00"
            }
          ],
          "priceRange": "$$",
          "image": "https://optima-optique.com/og-image.png"
        };

      case "Product":
        if (!data) return null;
        const productData = data as ProductData;
        return {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": productData.name,
          "description": productData.description,
          "image": productData.image_url,
          "brand": {
            "@type": "Brand",
            "name": productData.brand
          },
          "offers": {
            "@type": "Offer",
            "price": productData.price,
            "priceCurrency": "TND",
            "availability": productData.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "url": `https://optima-optique.com/produits/${productData.id}`
          }
        };

      case "WebPage":
        const webPageData = (data as WebPageData) || {};
        return {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": webPageData.title || "Optima Optique",
          "description": webPageData.description || "Votre opticien de confiance au Krib",
          "url": webPageData.url || "https://optima-optique.com"
        };

      default:
        return null;
    }
  };

  const structuredData = getStructuredData();

  if (!structuredData) return null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
