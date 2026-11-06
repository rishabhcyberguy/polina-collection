import type { ContactLink } from "@/components/SocialFlipButton";
import { normalizeInternalPath } from "@shared/internal-path";

export type SiteContent = {
  heroHeading: string;
  heroDescription: string;
  heroCtaLabel: string;
  heroCtaTarget: string;
  editorialHeading: string;
  editorialBody: string;
  footerNote: string;
  contactLinks: ContactLink[];
  featuredProductIds?: number[];
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  heroHeading: "POLINA",
  heroDescription: "Sensorial luxury and editorial nightwear silhouettes crafted for uncompromising presence.",
  heroCtaLabel: "Explore the collection",
  heroCtaTarget: "/collections",
  editorialHeading: "Made for your own kind of night.",
  editorialBody: "Tactile expression and modern silhouettes. POLINA curates nightwear and elevated loungewear with bold editorial distinction.",
  footerNote: "POLINA STUDIOS · ALL RIGHTS RESERVED",
  contactLinks: [
    {
      label: "Email Us",
      href: "mailto:skfasionmart@gmail.com",
      icon: "email",
    },
    {
      label: "Call / WhatsApp",
      href: "tel:+919560849553",
      icon: "phone",
    },
    {
      label: "Amazon Store",
      href: "https://www.amazon.in/storefront?me=A12LTZ308EZ348&ref_=ssf_share",
      icon: "amazon",
    },
    {
      label: "Flipkart Store",
      href: "https://www.flipkart.com/search?q=polina+women+nighty&as=on&as-show=on&otracker=AS_Query_OrganicAutoSuggest_1_13_na_na_na&otracker1=AS_Query_OrganicAutoSuggest_1_13_na_na_na&as-pos=1&as-type=RECENT&suggestionId=polina+women+nighty&requestId=0c69e4f3-be2a-4be8-80b6-46eac4b951ce&as-searchtext=polina%20womens",
      icon: "flipkart",
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/polina_fashion7/",
      icon: "instagram",
    },
  ],
  featuredProductIds: [1],
};

export function isSiteContent(value: unknown): value is SiteContent {
  if (!value || typeof value !== "object") return false;
  const content = value as Partial<SiteContent>;
  return typeof content.heroHeading === "string"
    && typeof content.heroDescription === "string"
    && Array.isArray(content.contactLinks)
    && (content.featuredProductIds === undefined || (Array.isArray(content.featuredProductIds) && content.featuredProductIds.every((id) => Number.isInteger(id) && id > 0)));
}

export function safeInternalTarget(value: string) {
  return normalizeInternalPath(value) ?? "/collections";
}
