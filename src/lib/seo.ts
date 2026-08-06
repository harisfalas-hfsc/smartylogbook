/**
 * Centralised SEO / GEO / AEO metadata for Smarty Logbook.
 * Nothing here renders visible UI, it only feeds <head> tags and JSON-LD.
 */

export const SITE_URL = "https://smartylogbook.com";
export const SITE_NAME = "Smarty Logbook";
export const SOCIAL_IMAGE = `${SITE_URL}/social-image.png`;

export const BRAND_DESCRIPTION =
  "Smarty Logbook is an AI-powered universal digital logbook and life operating system. Create unlimited logbooks for health, finance, business, habits, goals, projects, learning, travel and anything else you want to record, and let the AI classify, connect and analyse it for you.";

export type PageSeo = {
  title: string;
  description: string;
  keywords?: string;
  noindex?: boolean;
  /** Extra JSON-LD graph nodes for this route. */
  schema?: Record<string, unknown>[];
  breadcrumb?: { name: string; path: string }[];
};

const softwareApplication = {
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}/#software`,
  name: "Smarty Logbook",
  alternateName: [
    "Smarty LogBook",
    "AI Logbook",
    "Universal Digital Logbook",
    "Personal Operating System",
  ],
  applicationCategory: "ProductivityApplication",
  applicationSubCategory: "Personal Knowledge Management",
  operatingSystem: "Web, iOS, Android",
  url: SITE_URL,
  description: BRAND_DESCRIPTION,
  image: SOCIAL_IMAGE,
  featureList: [
    "Unlimited custom digital logbooks",
    "AI automatic classification of text, voice, photos and documents",
    "AI relationship engine that links related records",
    "Natural language search across your entire knowledge base",
    "Smarty Assistant personal AI assistant",
    "Proactive reminders and pattern detection",
    "Life analytics and plain-language insights",
    "Private, encrypted personal database",
  ],
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "EUR",
      category: "free",
    },
    {
      "@type": "Offer",
      name: "Premium",
      price: "9.99",
      priceCurrency: "EUR",
      category: "subscription",
      description: "Full access including the Smarty Assistant.",
    },
  ],
  publisher: { "@id": `${SITE_URL}/#organization` },
};

const organization = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Smarty Logbook",
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  description: BRAND_DESCRIPTION,
};

const website = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: BRAND_DESCRIPTION,
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/faq?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

/** Always-present nodes on every page. */
export const globalSchema = [organization, website, softwareApplication];

const K = {
  core: "digital logbook, AI logbook, smart logbook, life logbook, personal logbook, online logbook, universal logbook, digital journal, AI journal, digital notebook, AI notebook, second brain, personal knowledge management, PKM, life operating system, personal operating system, AI organizer, AI planner, habit tracker, goal tracker, business tracker, health tracker, finance tracker, personal database, life analytics",
};

export const SEO_BY_PATH: Record<string, PageSeo> = {
  "/": {
    title: "Smarty Logbook: AI Digital Logbook & Life Operating System",
    description:
      "Smarty Logbook is the AI-powered universal digital logbook. Record anything, health, finance, business, habits, goals, travel, and let AI organise, connect and explain your life.",
    keywords: K.core,
    schema: [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: `${SITE_URL}/`,
        name: "Smarty Logbook: AI Digital Logbook & Life Operating System",
        description: BRAND_DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#software` },
        primaryImageOfPage: SOCIAL_IMAGE,
      },
    ],
  },
  "/about": {
    title: "About Smarty Logbook: The Universal AI Logbook Explained",
    description:
      "What Smarty Logbook is, who it is for and why it exists: an AI second brain that captures, classifies and connects unlimited logbooks across every area of your life.",
    keywords:
      "about smarty logbook, what is a digital logbook, AI second brain, knowledge management app, personal database app",
    breadcrumb: [{ name: "About", path: "/about" }],
  },
  "/how-it-works": {
    title: "How Smarty Logbook Works, Capture, Classify, Connect, Ask",
    description:
      "Learn how Smarty Logbook works: capture by text, voice, photo or document, let AI classify and link it automatically, then ask questions in plain language.",
    keywords:
      "how digital logbook works, AI note classification, AI knowledge graph, plain language search, second brain workflow",
    breadcrumb: [{ name: "How it works", path: "/how-it-works" }],
    schema: [
      {
        "@type": "HowTo",
        name: "How to use Smarty Logbook",
        description:
          "Four steps to turn everyday life into an organised, searchable AI knowledge base.",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Capture",
            text: "Add anything by text, voice, photo or document, no forms, no categories.",
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Classify",
            text: "The AI reads the entry, extracts details and files it in the right logbook automatically.",
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Connect",
            text: "The relationship engine links the new record to related history, building your knowledge graph.",
          },
          {
            "@type": "HowToStep",
            position: 4,
            name: "Ask",
            text: "Ask the Smarty Assistant anything in plain language and get answers from your own data.",
          },
        ],
      },
    ],
  },
  "/pricing": {
    title: "Pricing, Smarty Logbook Free & Premium (€9.99/month)",
    description:
      "Simple pricing: Free for capturing and organising your logbooks, Premium at €9.99 per month for the full Smarty Assistant, insights and proactive reminders.",
    keywords:
      "smarty logbook pricing, digital logbook price, AI journal subscription, personal knowledge management pricing",
    breadcrumb: [{ name: "Pricing", path: "/pricing" }],
  },
  "/testimonials": {
    title: "Testimonials, What People Use Smarty Logbook For",
    description:
      "Real-world stories from people using Smarty Logbook as a second brain for health records, finances, business tracking, habits and daily journaling.",
    keywords: "smarty logbook reviews, digital logbook testimonials, second brain reviews",
    breadcrumb: [{ name: "Testimonials", path: "/testimonials" }],
  },
  "/faq": {
    title: "Smarty Logbook FAQ, Questions About the AI Logbook",
    description:
      "Answers about how Smarty Logbook classifies entries, what you can track, how the Smarty Assistant works, plans and pricing, privacy, and data ownership.",
    keywords:
      "smarty logbook faq, digital logbook questions, AI journal privacy, what can I track",
    breadcrumb: [{ name: "FAQ", path: "/faq" }],
  },
  "/security": {
    title: "Security & Privacy, How Smarty Logbook Protects Your Data",
    description:
      "Encryption, row-level access control, GDPR rights and full data deletion: how Smarty Logbook keeps your personal logbooks private and under your control.",
    keywords: "logbook data security, GDPR journal app, encrypted personal database",
    breadcrumb: [{ name: "Security", path: "/security" }],
  },
  "/contact": {
    title: "Contact & Support, Smarty Logbook",
    description:
      "Get help with Smarty Logbook. Ask Smarty Assistant for instant fixes, or send us a message with a screenshot and we answer by email.",
    keywords: "smarty logbook support, contact smarty logbook, logbook app help",
    breadcrumb: [{ name: "Contact", path: "/contact" }],
  },
  "/privacy-policy": {
    title: "Privacy Policy, Smarty Logbook",
    description:
      "How Smarty Logbook collects, processes, stores and deletes personal data, and the rights you have over your logbooks.",
    breadcrumb: [{ name: "Privacy Policy", path: "/privacy-policy" }],
  },
  "/terms-and-conditions": {
    title: "Terms & Conditions, Smarty Logbook",
    description:
      "The terms governing the use of Smarty Logbook, including accounts, subscriptions, acceptable use and liability.",
    breadcrumb: [{ name: "Terms & Conditions", path: "/terms-and-conditions" }],
  },
  "/disclaimer": {
    title: "Disclaimer, Smarty Logbook",
    description:
      "Smarty Logbook provides organisational and informational support only and does not provide medical, legal or financial advice.",
    breadcrumb: [{ name: "Disclaimer", path: "/disclaimer" }],
  },
  "/auth": {
    title: "Sign In or Create Your Smarty Logbook Account",
    description:
      "Sign in or create a free Smarty Logbook account and start your AI-powered digital logbook in under a minute.",
    noindex: true,
  },
};

export const FALLBACK_SEO: PageSeo = {
  title: "Smarty Logbook: AI Digital Logbook & Life Operating System",
  description: BRAND_DESCRIPTION,
  noindex: true,
};

export function getSeoForPath(pathname: string): PageSeo {
  const clean =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return SEO_BY_PATH[clean] ?? FALLBACK_SEO;
}

export function buildBreadcrumb(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/`,
      },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: item.name,
        item: `${SITE_URL}${item.path}`,
      })),
    ],
  };
}
