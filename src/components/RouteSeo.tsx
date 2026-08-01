import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  SITE_NAME,
  SITE_URL,
  SOCIAL_IMAGE,
  buildBreadcrumb,
  getSeoForPath,
  globalSchema,
} from "@/lib/seo";
import { faqs } from "@/lib/marketing";

/**
 * Renders per-route <head> metadata and JSON-LD.
 * Produces no visible output.
 */
export default function RouteSeo() {
  const { pathname } = useLocation();
  const seo = getSeoForPath(pathname);
  const canonical = `${SITE_URL}${pathname === "/" ? "/" : pathname.replace(/\/$/, "")}`;

  const faqSchema =
    pathname.replace(/\/$/, "") === "/faq"
      ? [
          {
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]
      : [];

  const graph = [
    ...globalSchema,
    ...faqSchema,
    ...(seo.breadcrumb ? [buildBreadcrumb(seo.breadcrumb)] : []),
    ...(seo.schema ?? []),
  ];

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en" />
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      {seo.keywords ? <meta name="keywords" content={seo.keywords} /> : null}
      <meta
        name="robots"
        content={
          seo.noindex
            ? "noindex, nofollow"
            : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        }
      />
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="en" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={SOCIAL_IMAGE} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={SOCIAL_IMAGE} />

      <script type="application/ld+json">
        {JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}
      </script>
    </Helmet>
  );
}
