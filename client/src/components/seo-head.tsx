import { Helmet } from "react-helmet-async";
import defaultOgImage from "@assets/CG3_1755280257029.webp";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  structuredData?: object;
}

export function SEOHead({
  title = "CrawlGuard LLC - Expert Crawl Space & Basement Waterproofing in Asheville, NC",
  description = "Professional crawl space waterproofing, encapsulation, and mold remediation services in Asheville, NC. Free estimates. Serving Marshall, Weaverville, and surrounding areas.",
  keywords = "crawl space waterproofing, basement waterproofing, mold remediation, Asheville NC, Marshall NC, vapor barriers, encapsulation",
  canonicalUrl = "https://crawlguardllc.com",
  ogTitle,
  ogDescription,
  ogImage = defaultOgImage,
  structuredData
}: SEOHeadProps) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle || title} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Local Business Schema */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
