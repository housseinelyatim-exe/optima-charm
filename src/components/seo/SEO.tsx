import { Helmet } from "react-helmet";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
}

export function SEO({
  title = "Optima Optique - Votre opticien de confiance au Krib",
  description = "Découvrez notre collection exclusive de lunettes de vue et de soleil au Krib. Grandes marques, conseils personnalisés et livraison gratuite en Tunisie.",
  canonical,
  ogImage = "https://optima-optique.com/og-image.png",
  noindex = false,
}: SEOProps) {
  const fullTitle = title.includes("Optima Optique") ? title : `${title} | Optima Optique`;
  const url = canonical || "https://optima-optique.com";

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow" />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="fr_TN" />
      <meta property="og:site_name" content="Optima Optique" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
