import type { ExternalProfile, ProductEntry } from "./types";

export const owner = {
  name: "Sebastian Houcem",
  role: "Independent Digital Creator & Digital Products Seller",
  email: "",
};

/** Add only genuine products and owner-verified external purchase URLs. */
export const products: ProductEntry[] = [];

/** A profile appears only after a real URL is supplied and verified by the owner. */
export const marketplaces: ExternalProfile[] = [];
export const socialLinks: ExternalProfile[] = [];

/** Public values only. Set the real origin in GitHub repository variable SITE_URL. */
export const siteSettings = {
  publicSiteUrl: "",
  siteName: "Sebastian Houcem",
  defaultLocale: "en",
};
