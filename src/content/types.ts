export type Locale = "en" | "ar" | "de" | "ru" | "hi";
export type PageKind = "home" | "privacy" | "terms";
export type CategoryId = "graphic-design" | "templates-ui" | "print-on-demand" | "publications" | "creative-resources";

export interface LocaleCopy {
  code: Locale;
  localeName: string;
  dir: "ltr" | "rtl";
  nav: { home: string; about: string; products: string; contact: string; privacy: string; terms: string };
  hero: { eyebrow: string; title: string; subtitle: string; intro: string; primaryCta: string; secondaryCta: string };
  about: { eyebrow: string; title: string; body: string };
  products: { eyebrow: string; title: string; intro: string; emptyTitle: string; emptyBody: string; viewProduct: string; categories: string[] };
  marketplaces: { title: string; empty: string };
  contact: { eyebrow: string; title: string; body: string; missingEmail: string; emailCta: string };
  footer: { tagline: string; copyright: string };
  controls: { language: string; openMenu: string; closeMenu: string; darkMode: string; lightMode: string; skipToContent: string };
  legalStarterNotice: string;
  meta: { title: string; description: string };
}

export interface ProductEntry {
  id: string;
  name: string;
  description: string;
  localized?: Partial<Record<Locale, { name?: string; description?: string; imageAlt?: string }>>;
  category: CategoryId;
  purchaseUrl: string;
  verified: boolean;
  imagePath?: string;
  imageAlt?: string;
  price?: string;
  currency?: string;
}

export interface ExternalProfile {
  name: string;
  url: string;
  verified: boolean;
}
