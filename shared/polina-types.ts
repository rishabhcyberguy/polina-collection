export type ContactIcon =
  | "email"
  | "amazon"
  | "flipkart"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "twitter"
  | "github"
  | "discord"
  | "phone"
  | "other";

export type ContactLink = {
  label: string;
  href: string;
  icon: ContactIcon;
};

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

export type ProductImageSnapshot = {
  url: string;
  altText: string;
};

export type PublishedProductSnapshot = {
  name: string;
  slug: string;
  description: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  featured: boolean;
  informationalOnly: boolean;
  amazonUrl: string | null;
  flipkartUrl: string | null;
  images: ProductImageSnapshot[];
};

export type ProductStatus = "draft" | "published" | "archived";
export type PageStatus = "draft" | "published";

export type AdminAccount = {
  id: number;
  uid: string;
  email: string;
  name: string | null;
  role: "admin";
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date | null;
};

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: "firebase";
  role: "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductImage = {
  id: number;
  productId: number;
  storageKey: string;
  url: string;
  altText: string;
  sortOrder: number;
  createdAt: Date;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  categoryId: number | null;
  featured: boolean;
  informationalOnly: boolean;
  status: ProductStatus;
  hasDraftChanges: boolean;
  publishedSlug: string | null;
  publishedData: PublishedProductSnapshot | null;
  amazonUrl: string | null;
  flipkartUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
  publishedAt: Date | null;
  images: ProductImage[];
};

export type SitePage = {
  id: number;
  pageKey: string;
  draftContent: SiteContent;
  publishedContent: SiteContent | null;
  status: PageStatus;
  version: number;
  updatedAt: Date;
  updatedBy: number | null;
  publishedAt: Date | null;
};

export type ContentEdit = {
  id: number;
  entityType: string;
  entityId: string;
  entityLabel: string;
  action: string;
  editorEmail: string;
  createdAt: Date;
};
