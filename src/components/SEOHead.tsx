import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
}

export const SEOHead = ({ title, description, canonicalPath }: SEOHeadProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    }

    // Update canonical URL if provided
    if (canonicalPath) {
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute("href", `https://luvero.se${canonicalPath}`);
      }
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", title);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute("content", description);
    }

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl && canonicalPath) {
      ogUrl.setAttribute("content", `https://luvero.se${canonicalPath}`);
    }

    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute("content", title);
    }

    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute("content", description);
    }

    // Cleanup: restore original values when component unmounts
    return () => {
      document.title = "Luvero - Professionella Bilfoton på Sekunder | AI Bilredigering";
      
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          "Professionell bilhanterare för återförsäljare. AI-redigering av bilfoton på 20-30 sekunder. Prova gratis i 21 dagar - 50 bilder utan kreditkort."
        );
      }
    };
  }, [title, description, canonicalPath]);

  return null;
};
