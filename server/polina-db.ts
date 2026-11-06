import { and, asc, desc, eq, gt, isNull, ne } from "drizzle-orm";
import {
  adminAccounts,
  adminSessions,
  authRateLimits,
  categories,
  contentEdits,
  passwordResetTokens,
  productImages,
  products,
  sitePages,
  type AdminAccount,
  type PublishedProductSnapshot,
  type SiteContent,
} from "../drizzle/schema";
import { getDb } from "./db";
import { normalizeRetailerUrl } from "../shared/retailer";

// Default admin password hash for "PolinaAdmin2026!"
const DEFAULT_ADMIN_HASH = "scrypt$ZSYMuWF3z46V4NM55lfvlg$wUssT9f7mRShjwGQoZc7ng4_sBTw4tpZutipzXCEzxlp6p6b2QHjro-OL9NO252q4d7JRTL88YSa4MKtC66vAQ";

// In-memory fallback data store for environments without a dedicated MySQL database
interface MemoryAdmin {
  id: number;
  email: string;
  name: string | null;
  passwordHash: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date | null;
}

interface MemorySession {
  id: number;
  adminId: number;
  tokenHash: string;
  csrfHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

interface MemoryCategory {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MemoryProductImage {
  id: number;
  productId: number;
  storageKey: string;
  url: string;
  altText: string;
  sortOrder: number;
}

interface MemoryProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  categoryId: number | null;
  featured: boolean;
  informationalOnly: boolean;
  status: "draft" | "published" | "archived";
  hasDraftChanges: boolean;
  publishedSlug: string | null;
  publishedData: PublishedProductSnapshot | null;
  amazonUrl: string | null;
  flipkartUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  createdBy: number;
  updatedBy: number;
}

const memoryAdmins: MemoryAdmin[] = [
  {
    id: 1,
    email: "rishabhkp162012@gmail.com",
    name: "Rishabh (POLINA Administrator)",
    passwordHash: DEFAULT_ADMIN_HASH,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: null,
  },
];

const memorySessions: MemorySession[] = [];
const memoryRateLimits = new Map<string, { attempts: number; windowStartedAt: Date; blockedUntil: Date | null }>();
const memoryResetTokens: Array<{ id: number; adminId: number; tokenHash: string; createdAt: Date; expiresAt: Date; usedAt: Date | null }> = [];
const memoryEdits: Array<{ id: number; entityType: string; entityId: string; entityLabel: string; action: string; editorEmail: string; createdAt: Date }> = [];

const memoryCategories: MemoryCategory[] = [
  { id: 1, name: "Co-Ord Set", slug: "co-ord-set", sortOrder: 1, active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, name: "Nightwear", slug: "nightwear", sortOrder: 2, active: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, name: "Robes & Lounge", slug: "robes-lounge", sortOrder: 3, active: true, createdAt: new Date(), updatedAt: new Date() },
];

const memoryProductImages: MemoryProductImage[] = [
  {
    id: 1,
    productId: 1,
    storageKey: "hero-showcase",
    url: "/assets/aistudio/DSC00916_copy_c03a84f5.jpg",
    altText: "POLINA Dark Velour Set — Front Silhouette",
    sortOrder: 1,
  },
  {
    id: 2,
    productId: 1,
    storageKey: "detail-showcase",
    url: "/assets/aistudio/DSC00922_copy_12df23bb.jpg",
    altText: "POLINA Dark Velour Set — Tactile Texture & Editorial Detail",
    sortOrder: 2,
  },
];

const memoryProducts: MemoryProduct[] = [
  {
    id: 1,
    name: "Dark Velour Set",
    slug: "dark-velour-set",
    description: "Premium tactile velour tracksuit designed with contemporary editorial proportions. Features an architectural high-collar silhouette, deep obsidian velour finish, and tailored cuffs for uncompromising presence.",
    categoryId: 1,
    featured: true,
    informationalOnly: true,
    status: "published",
    hasDraftChanges: false,
    publishedSlug: "dark-velour-set",
    amazonUrl: null,
    flipkartUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
    createdBy: 1,
    updatedBy: 1,
    publishedData: {
      name: "Dark Velour Set",
      slug: "dark-velour-set",
      description: "Premium tactile velour tracksuit designed with contemporary editorial proportions. Features an architectural high-collar silhouette, deep obsidian velour finish, and tailored cuffs for uncompromising presence.",
      categoryId: 1,
      categoryName: "Co-Ord Set",
      categorySlug: "co-ord-set",
      featured: true,
      informationalOnly: true,
      amazonUrl: null,
      flipkartUrl: null,
      images: [
        {
          url: "/assets/aistudio/DSC00916_copy_c03a84f5.jpg",
          altText: "POLINA Dark Velour Set — Front Silhouette",
        },
        {
          url: "/assets/aistudio/DSC00922_copy_12df23bb.jpg",
          altText: "POLINA Dark Velour Set — Tactile Texture & Editorial Detail",
        },
      ],
    },
  },
];

const OFFICIAL_CONTACT_LINKS = [
  { label: "Email Us", href: "mailto:skfasionmart@gmail.com", icon: "email" },
  { label: "Call / WhatsApp", href: "tel:+919560849553", icon: "phone" },
  { label: "Amazon Store", href: "https://www.amazon.in/storefront?me=A12LTZ308EZ348&ref_=ssf_share", icon: "amazon" },
  { label: "Flipkart Store", href: "https://www.flipkart.com/search?q=polina+women+nighty&as=on&as-show=on&otracker=AS_Query_OrganicAutoSuggest_1_13_na_na_na&otracker1=AS_Query_OrganicAutoSuggest_1_13_na_na_na&as-pos=1&as-type=RECENT&suggestionId=polina+women+nighty&requestId=0c69e4f3-be2a-4be8-80b6-46eac4b951ce&as-searchtext=polina%20womens", icon: "flipkart" },
  { label: "Instagram", href: "https://www.instagram.com/polina_fashion7/", icon: "instagram" },
];

const memoryPages: Array<{ id: number; pageKey: string; draftContent: SiteContent; publishedContent: SiteContent | null; status: "draft" | "published"; version: number; updatedAt: Date }> = [
  {
    id: 1,
    pageKey: "home",
    draftContent: {
      heroHeading: "POLINA",
      heroDescription: "Sensorial luxury and editorial nightwear silhouettes crafted for uncompromising presence.",
      heroCtaLabel: "Explore the collection",
      heroCtaTarget: "/collections",
      editorialHeading: "Made for your own kind of night.",
      editorialBody: "Tactile expression and modern silhouettes. POLINA curates nightwear and elevated loungewear with bold editorial distinction.",
      footerNote: "POLINA STUDIOS · ALL RIGHTS RESERVED",
      contactLinks: OFFICIAL_CONTACT_LINKS,
      featuredProductIds: [1],
    },
    publishedContent: {
      heroHeading: "POLINA",
      heroDescription: "Sensorial luxury and editorial nightwear silhouettes crafted for uncompromising presence.",
      heroCtaLabel: "Explore the collection",
      heroCtaTarget: "/collections",
      editorialHeading: "Made for your own kind of night.",
      editorialBody: "Tactile expression and modern silhouettes. POLINA curates nightwear and elevated loungewear with bold editorial distinction.",
      footerNote: "POLINA STUDIOS · ALL RIGHTS RESERVED",
      contactLinks: OFFICIAL_CONTACT_LINKS,
      featuredProductIds: [1],
    },
    status: "published",
    version: 1,
    updatedAt: new Date(),
  },
];

export async function ensureDefaultAdmin() {
  const db = await getDb();
  if (db) {
    try {
      const rows = await db.select().from(adminAccounts).limit(1);
      if (rows.length === 0) {
        await db.insert(adminAccounts).values({
          email: "rishabhkp162012@gmail.com",
          name: "Rishabh (POLINA Administrator)",
          passwordHash: DEFAULT_ADMIN_HASH,
          active: true,
        });
      }
    } catch {
      // Ignored
    }
  }
}

export async function findAdminByEmail(email: string) {
  const db = await getDb();
  if (db) {
    const [row] = await db.select().from(adminAccounts).where(eq(adminAccounts.email, email)).limit(1);
    return row ?? null;
  }
  return memoryAdmins.find((a) => a.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findAdminById(id: number) {
  const db = await getDb();
  if (db) {
    const [row] = await db.select().from(adminAccounts).where(eq(adminAccounts.id, id)).limit(1);
    return row ?? null;
  }
  return memoryAdmins.find((a) => a.id === id) ?? null;
}

export async function createAdminAccount(input: { email: string; name: string | null; passwordHash: string }) {
  const db = await getDb();
  if (db) {
    const result = await db.insert(adminAccounts).values({
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
      active: true,
    });
    return Number((result[0] as { insertId?: number }).insertId);
  }
  const id = memoryAdmins.length + 1;
  memoryAdmins.push({
    id,
    email: input.email,
    name: input.name,
    passwordHash: input.passwordHash,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: null,
  });
  return id;
}

export async function updateAdminLastSignedIn(id: number) {
  const db = await getDb();
  if (db) {
    await db.update(adminAccounts).set({ lastSignedIn: new Date() }).where(eq(adminAccounts.id, id));
    return;
  }
  const admin = memoryAdmins.find((a) => a.id === id);
  if (admin) admin.lastSignedIn = new Date();
}

export async function createAdminSession(input: {
  adminId: number;
  tokenHash: string;
  csrfHash: string;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (db) {
    await db.insert(adminSessions).values(input);
    return;
  }
  memorySessions.push({
    id: memorySessions.length + 1,
    adminId: input.adminId,
    tokenHash: input.tokenHash,
    csrfHash: input.csrfHash,
    createdAt: new Date(),
    expiresAt: input.expiresAt,
    revokedAt: null,
  });
}

export async function findAdminForSession(tokenHash: string) {
  const db = await getDb();
  const now = new Date();
  if (db) {
    const [row] = await db
      .select({
        sessionId: adminSessions.id,
        sessionTokenHash: adminSessions.tokenHash,
        csrfHash: adminSessions.csrfHash,
        expiresAt: adminSessions.expiresAt,
        admin: adminAccounts,
      })
      .from(adminSessions)
      .innerJoin(adminAccounts, eq(adminSessions.adminId, adminAccounts.id))
      .where(and(
        eq(adminSessions.tokenHash, tokenHash),
        isNull(adminSessions.revokedAt),
        gt(adminSessions.expiresAt, now),
        eq(adminAccounts.active, true),
      ))
      .limit(1);
    return row ?? null;
  }
  const sess = memorySessions.find((s) => s.tokenHash === tokenHash && !s.revokedAt && s.expiresAt > now);
  if (!sess) return null;
  const admin = memoryAdmins.find((a) => a.id === sess.adminId && a.active);
  if (!admin) return null;
  return {
    sessionId: sess.id,
    sessionTokenHash: sess.tokenHash,
    csrfHash: sess.csrfHash,
    expiresAt: sess.expiresAt,
    admin,
  };
}

export async function revokeAdminSession(tokenHash: string) {
  const db = await getDb();
  if (db) {
    await db.update(adminSessions).set({ revokedAt: new Date() })
      .where(and(eq(adminSessions.tokenHash, tokenHash), isNull(adminSessions.revokedAt)));
    return;
  }
  const sess = memorySessions.find((s) => s.tokenHash === tokenHash);
  if (sess) sess.revokedAt = new Date();
}

export async function revokeAllAdminSessions(adminId: number) {
  const db = await getDb();
  if (db) {
    await db.update(adminSessions).set({ revokedAt: new Date() })
      .where(and(eq(adminSessions.adminId, adminId), isNull(adminSessions.revokedAt)));
    return;
  }
  for (const sess of memorySessions) {
    if (sess.adminId === adminId) sess.revokedAt = new Date();
  }
}

export async function createPasswordResetToken(input: { adminId: number; tokenHash: string; expiresAt: Date }) {
  const db = await getDb();
  if (db) {
    await db.insert(passwordResetTokens).values(input);
    return;
  }
  memoryResetTokens.push({ id: memoryResetTokens.length + 1, ...input, createdAt: new Date(), usedAt: null });
}

export async function findPasswordResetToken(tokenHash: string) {
  const db = await getDb();
  const now = new Date();
  if (db) {
    const [row] = await db.select().from(passwordResetTokens).where(and(
      eq(passwordResetTokens.tokenHash, tokenHash),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, now),
    )).limit(1);
    return row ?? null;
  }
  return memoryResetTokens.find((t) => t.tokenHash === tokenHash && !t.usedAt && t.expiresAt > now) ?? null;
}

export async function consumePasswordReset(input: { tokenHash: string; adminId: number; passwordHash: string }) {
  const db = await getDb();
  const now = new Date();
  if (db) {
    await db.transaction(async (tx) => {
      const [token] = await tx.select().from(passwordResetTokens).where(and(
        eq(passwordResetTokens.tokenHash, input.tokenHash),
        eq(passwordResetTokens.adminId, input.adminId),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now),
      )).limit(1);
      if (!token) throw new Error("This password reset link is invalid or expired.");
      await tx.update(passwordResetTokens).set({ usedAt: now }).where(eq(passwordResetTokens.id, token.id));
      await tx.update(adminAccounts).set({ passwordHash: input.passwordHash, updatedAt: now })
        .where(eq(adminAccounts.id, input.adminId));
      await tx.update(adminSessions).set({ revokedAt: now })
        .where(and(eq(adminSessions.adminId, input.adminId), isNull(adminSessions.revokedAt)));
    });
    return;
  }
  const token = memoryResetTokens.find((t) => t.tokenHash === input.tokenHash && t.adminId === input.adminId && !t.usedAt && t.expiresAt > now);
  if (!token) throw new Error("This password reset link is invalid or expired.");
  token.usedAt = now;
  const admin = memoryAdmins.find((a) => a.id === input.adminId);
  if (admin) {
    admin.passwordHash = input.passwordHash;
    admin.updatedAt = now;
  }
  for (const s of memorySessions) {
    if (s.adminId === input.adminId) s.revokedAt = now;
  }
}

export async function hitAuthRateLimit(input: {
  bucketKey: string;
  maxAttempts: number;
  windowMs: number;
  blockMs: number;
}) {
  const db = await getDb();
  const now = new Date();
  if (db) {
    const [row] = await db.select().from(authRateLimits).where(eq(authRateLimits.bucketKey, input.bucketKey)).limit(1);
    if (!row) {
      await db.insert(authRateLimits).values({ bucketKey: input.bucketKey, attempts: 1, windowStartedAt: now });
      return { limited: false, retryAfterMs: 0 };
    }
    if (row.blockedUntil && row.blockedUntil > now) {
      return { limited: true, retryAfterMs: row.blockedUntil.getTime() - now.getTime() };
    }
    const inWindow = now.getTime() - row.windowStartedAt.getTime() < input.windowMs;
    const attempts = inWindow ? row.attempts + 1 : 1;
    const blockedUntil = attempts > input.maxAttempts ? new Date(now.getTime() + input.blockMs) : null;
    await db.update(authRateLimits).set({
      attempts,
      windowStartedAt: inWindow ? row.windowStartedAt : now,
      blockedUntil,
    }).where(eq(authRateLimits.bucketKey, input.bucketKey));
    return blockedUntil
      ? { limited: true, retryAfterMs: input.blockMs }
      : { limited: false, retryAfterMs: 0 };
  }
  const entry = memoryRateLimits.get(input.bucketKey);
  if (!entry) {
    memoryRateLimits.set(input.bucketKey, { attempts: 1, windowStartedAt: now, blockedUntil: null });
    return { limited: false, retryAfterMs: 0 };
  }
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return { limited: true, retryAfterMs: entry.blockedUntil.getTime() - now.getTime() };
  }
  const inWindow = now.getTime() - entry.windowStartedAt.getTime() < input.windowMs;
  const attempts = inWindow ? entry.attempts + 1 : 1;
  const blockedUntil = attempts > input.maxAttempts ? new Date(now.getTime() + input.blockMs) : null;
  memoryRateLimits.set(input.bucketKey, {
    attempts,
    windowStartedAt: inWindow ? entry.windowStartedAt : now,
    blockedUntil,
  });
  return blockedUntil
    ? { limited: true, retryAfterMs: input.blockMs }
    : { limited: false, retryAfterMs: 0 };
}

export async function clearAuthRateLimit(bucketKey: string) {
  const db = await getDb();
  if (db) {
    await db.delete(authRateLimits).where(eq(authRateLimits.bucketKey, bucketKey));
    return;
  }
  memoryRateLimits.delete(bucketKey);
}

export async function listActiveCategories() {
  const db = await getDb();
  if (db) {
    return db.select().from(categories).where(eq(categories.active, true)).orderBy(asc(categories.sortOrder), asc(categories.name));
  }
  return memoryCategories.filter((c) => c.active).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listAdminCategories() {
  const db = await getDb();
  if (db) {
    return db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
  }
  return [...memoryCategories].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function saveCategory(input: { id?: number; name: string; slug: string; sortOrder: number }) {
  const db = await getDb();
  if (db) {
    const existingSlug = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, input.slug)).limit(1);
    if (existingSlug[0] && existingSlug[0].id !== input.id) throw new Error("That category slug is already in use.");
    if (input.id) {
      await db.update(categories).set({ name: input.name, slug: input.slug, sortOrder: input.sortOrder, active: true })
        .where(eq(categories.id, input.id));
      return input.id;
    }
    const result = await db.insert(categories).values({ name: input.name, slug: input.slug, sortOrder: input.sortOrder, active: true });
    return Number((result[0] as { insertId?: number }).insertId);
  }
  const existing = memoryCategories.find((c) => c.slug === input.slug);
  if (existing && existing.id !== input.id) throw new Error("That category slug is already in use.");
  if (input.id) {
    const cat = memoryCategories.find((c) => c.id === input.id);
    if (cat) {
      cat.name = input.name;
      cat.slug = input.slug;
      cat.sortOrder = input.sortOrder;
      cat.active = true;
      cat.updatedAt = new Date();
      return input.id;
    }
  }
  const id = memoryCategories.length + 1;
  memoryCategories.push({
    id,
    name: input.name,
    slug: input.slug,
    sortOrder: input.sortOrder,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

export async function archiveCategory(id: number) {
  const db = await getDb();
  if (db) {
    await db.update(categories).set({ active: false }).where(eq(categories.id, id));
    return;
  }
  const cat = memoryCategories.find((c) => c.id === id);
  if (cat) cat.active = false;
}

export async function listPublishedProducts(categorySlug?: string) {
  const db = await getDb();
  if (db) {
    const rows = await db.select().from(products).where(eq(products.status, "published"))
      .orderBy(desc(products.featured), desc(products.publishedAt));
    return rows
      .filter((row) => Boolean(row.publishedData) && (!categorySlug || row.publishedData?.categorySlug === categorySlug))
      .map((row) => ({ id: row.id, ...row.publishedData!, publishedAt: row.publishedAt }));
  }
  return memoryProducts
    .filter((p) => p.status === "published" && (!categorySlug || p.publishedData?.categorySlug === categorySlug))
    .map((p) => ({ id: p.id, ...p.publishedData!, publishedAt: p.publishedAt }));
}

export async function getPublishedProduct(slug: string) {
  const db = await getDb();
  if (db) {
    const [row] = await db.select().from(products).where(and(
      eq(products.status, "published"),
      eq(products.publishedSlug, slug),
    )).limit(1);
    return row?.publishedData ? { id: row.id, ...row.publishedData, publishedAt: row.publishedAt } : null;
  }
  const prod = memoryProducts.find((p) => p.status === "published" && p.publishedSlug === slug);
  return prod?.publishedData ? { id: prod.id, ...prod.publishedData, publishedAt: prod.publishedAt } : null;
}

export async function getPublishedPage(pageKey: string) {
  const db = await getDb();
  if (db) {
    const [row] = await db.select().from(sitePages).where(eq(sitePages.pageKey, pageKey)).limit(1);
    return row?.publishedContent ?? null;
  }
  const page = memoryPages.find((p) => p.pageKey === pageKey);
  return page?.publishedContent ?? null;
}

async function getProductImages(productId: number) {
  const db = await getDb();
  if (db) {
    return db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(asc(productImages.sortOrder), asc(productImages.id));
  }
  return memoryProductImages.filter((i) => i.productId === productId).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getAdminProduct(id: number) {
  const db = await getDb();
  if (db) {
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!product) return null;
    const images = await getProductImages(id);
    const [category] = product.categoryId
      ? await db.select().from(categories).where(eq(categories.id, product.categoryId)).limit(1)
      : [];
    return { ...product, images, category: category ?? null };
  }
  const prod = memoryProducts.find((p) => p.id === id);
  if (!prod) return null;
  const images = await getProductImages(id);
  const category = memoryCategories.find((c) => c.id === prod.categoryId) ?? null;
  return { ...prod, images, category };
}

export async function listAdminProducts() {
  const db = await getDb();
  if (db) {
    const rows = await db.select().from(products).where(ne(products.status, "archived")).orderBy(desc(products.updatedAt));
    const result = [];
    for (const product of rows) {
      const [category] = product.categoryId
        ? await db.select().from(categories).where(eq(categories.id, product.categoryId)).limit(1)
        : [];
      const images = await getProductImages(product.id);
      result.push({ ...product, category: category ?? null, images });
    }
    return result;
  }
  const result = [];
  for (const prod of memoryProducts.filter((p) => p.status !== "archived")) {
    const images = await getProductImages(prod.id);
    const category = memoryCategories.find((c) => c.id === prod.categoryId) ?? null;
    result.push({ ...prod, category, images });
  }
  return result;
}

export async function saveProductDraft(input: {
  id?: number;
  name: string;
  slug: string;
  description: string;
  categoryId: number | null;
  featured: boolean;
  informationalOnly: boolean;
  amazonUrl: string | null;
  flipkartUrl: string | null;
  editor: AdminAccount;
}) {
  const db = await getDb();
  const now = new Date();
  if (db) {
    const [slugOwner] = await db.select({ id: products.id }).from(products).where(eq(products.slug, input.slug)).limit(1);
    if (slugOwner && slugOwner.id !== input.id) throw new Error("That product slug is already in use.");
    let id = input.id;
    if (id) {
      const [current] = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (!current || current.status === "archived") throw new Error("Product not found.");
      await db.update(products).set({
        name: input.name,
        slug: input.slug,
        description: input.description,
        categoryId: input.categoryId,
        featured: input.featured,
        informationalOnly: input.informationalOnly,
        amazonUrl: input.amazonUrl,
        flipkartUrl: input.flipkartUrl,
        status: current.status === "published" ? "published" : "draft",
        hasDraftChanges: current.status === "published",
        updatedBy: input.editor.id,
        updatedAt: now,
      }).where(eq(products.id, id));
    } else {
      const result = await db.insert(products).values({
        name: input.name,
        slug: input.slug,
        description: input.description,
        categoryId: input.categoryId,
        featured: input.featured,
        informationalOnly: input.informationalOnly,
        amazonUrl: input.amazonUrl,
        flipkartUrl: input.flipkartUrl,
        status: "draft",
        hasDraftChanges: false,
        createdBy: input.editor.id,
        updatedBy: input.editor.id,
      });
      id = Number((result[0] as { insertId?: number }).insertId);
    }
    await recordEdit({ entityType: "product", entityId: String(id), entityLabel: input.name, action: "saved draft", editorEmail: input.editor.email });
    return id;
  }
  const existing = memoryProducts.find((p) => p.slug === input.slug);
  if (existing && existing.id !== input.id) throw new Error("That product slug is already in use.");
  let id = input.id;
  if (id) {
    const prod = memoryProducts.find((p) => p.id === id);
    if (!prod || prod.status === "archived") throw new Error("Product not found.");
    Object.assign(prod, {
      name: input.name,
      slug: input.slug,
      description: input.description,
      categoryId: input.categoryId,
      featured: input.featured,
      informationalOnly: input.informationalOnly,
      amazonUrl: input.amazonUrl,
      flipkartUrl: input.flipkartUrl,
      updatedBy: input.editor.id,
      updatedAt: now,
    });
  } else {
    id = memoryProducts.length + 1;
    memoryProducts.push({
      id,
      name: input.name,
      slug: input.slug,
      description: input.description,
      categoryId: input.categoryId,
      featured: input.featured,
      informationalOnly: input.informationalOnly,
      status: "draft",
      hasDraftChanges: false,
      publishedSlug: null,
      publishedData: null,
      amazonUrl: input.amazonUrl,
      flipkartUrl: input.flipkartUrl,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      createdBy: input.editor.id,
      updatedBy: input.editor.id,
    });
  }
  await recordEdit({ entityType: "product", entityId: String(id), entityLabel: input.name, action: "saved draft", editorEmail: input.editor.email });
  return id;
}

export async function addProductImage(input: {
  productId: number;
  storageKey: string;
  url: string;
  altText: string;
  sortOrder: number;
}) {
  const db = await getDb();
  if (db) {
    const [product] = await db.select({ id: products.id, status: products.status }).from(products).where(eq(products.id, input.productId)).limit(1);
    if (!product || product.status === "archived") throw new Error("Product not found.");
    const result = await db.insert(productImages).values(input);
    const imageId = Number((result[0] as { insertId?: number }).insertId);
    if (product.status === "published") {
      await db.update(products).set({ hasDraftChanges: true, updatedAt: new Date() }).where(eq(products.id, input.productId));
    }
    return imageId;
  }
  const id = memoryProductImages.length + 1;
  memoryProductImages.push({ id, ...input });
  return id;
}

export async function updateProductImageAlt(input: { productId: number; imageId: number; altText: string; sortOrder: number }) {
  const db = await getDb();
  if (db) {
    await db.update(productImages).set({ altText: input.altText, sortOrder: input.sortOrder })
      .where(and(eq(productImages.id, input.imageId), eq(productImages.productId, input.productId)));
    await db.update(products).set({ hasDraftChanges: true, updatedAt: new Date() }).where(eq(products.id, input.productId));
    return;
  }
  const img = memoryProductImages.find((i) => i.id === input.imageId && i.productId === input.productId);
  if (img) {
    img.altText = input.altText;
    img.sortOrder = input.sortOrder;
  }
}

export async function removeProductImage(productId: number, imageId: number) {
  const db = await getDb();
  if (db) {
    await db.delete(productImages).where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)));
    await db.update(products).set({ hasDraftChanges: true, updatedAt: new Date() }).where(eq(products.id, productId));
    return;
  }
  const idx = memoryProductImages.findIndex((i) => i.id === imageId && i.productId === productId);
  if (idx !== -1) memoryProductImages.splice(idx, 1);
}

export async function publishProduct(id: number, editor: AdminAccount) {
  const product = await getAdminProduct(id);
  if (!product || product.status === "archived") throw new Error("Product not found.");
  const category = product.category;
  if (!product.name.trim() || !product.slug.trim() || !category?.active || !product.images.length) {
    throw new Error("Add a name, unique slug, category, and at least one image before publishing.");
  }
  const snapshot: PublishedProductSnapshot = {
    name: product.name,
    slug: product.slug,
    description: product.description,
    categoryId: category.id,
    categoryName: category.name,
    categorySlug: category.slug,
    featured: product.featured,
    informationalOnly: product.informationalOnly,
    amazonUrl: product.amazonUrl,
    flipkartUrl: product.flipkartUrl,
    images: product.images.map((image) => ({ url: image.url, altText: image.altText })),
  };
  const now = new Date();
  const db = await getDb();
  if (db) {
    await db.update(products).set({
      status: "published",
      publishedSlug: product.slug,
      publishedData: snapshot,
      hasDraftChanges: false,
      publishedAt: now,
      updatedBy: editor.id,
      updatedAt: now,
    }).where(eq(products.id, id));
  } else {
    const p = memoryProducts.find((item) => item.id === id);
    if (p) {
      p.status = "published";
      p.publishedSlug = product.slug;
      p.publishedData = snapshot;
      p.hasDraftChanges = false;
      p.publishedAt = now;
      p.updatedBy = editor.id;
      p.updatedAt = now;
    }
  }
  await recordEdit({ entityType: "product", entityId: String(id), entityLabel: product.name, action: "published", editorEmail: editor.email });
}

export async function unpublishProduct(id: number, editor: AdminAccount) {
  const db = await getDb();
  if (db) {
    await db.update(products).set({ status: "draft", publishedSlug: null, publishedData: null, hasDraftChanges: false, publishedAt: null, updatedBy: editor.id, updatedAt: new Date() }).where(eq(products.id, id));
  } else {
    const p = memoryProducts.find((item) => item.id === id);
    if (p) {
      p.status = "draft";
      p.publishedSlug = null;
      p.publishedData = null;
    }
  }
  await recordEdit({ entityType: "product", entityId: String(id), entityLabel: String(id), action: "unpublished", editorEmail: editor.email });
}

export async function archiveProduct(id: number, editor: AdminAccount) {
  const db = await getDb();
  if (db) {
    await db.update(products).set({ status: "archived", publishedSlug: null, publishedData: null, hasDraftChanges: false, publishedAt: null, updatedBy: editor.id, updatedAt: new Date() }).where(eq(products.id, id));
  } else {
    const p = memoryProducts.find((item) => item.id === id);
    if (p) p.status = "archived";
  }
  await recordEdit({ entityType: "product", entityId: String(id), entityLabel: String(id), action: "archived", editorEmail: editor.email });
}

export async function getAdminSitePage(pageKey: string) {
  const db = await getDb();
  if (db) {
    const [row] = await db.select().from(sitePages).where(eq(sitePages.pageKey, pageKey)).limit(1);
    return row ?? null;
  }
  return memoryPages.find((p) => p.pageKey === pageKey) ?? null;
}

export async function saveSitePage(input: { pageKey: string; content: SiteContent; editor: AdminAccount }) {
  const now = new Date();
  const db = await getDb();
  if (db) {
    const [current] = await db.select().from(sitePages).where(eq(sitePages.pageKey, input.pageKey)).limit(1);
    if (current) {
      await db.update(sitePages).set({
        draftContent: input.content,
        version: current.version + 1,
        status: current.publishedContent ? "published" : "draft",
        updatedBy: input.editor.id,
        updatedAt: now,
      }).where(eq(sitePages.id, current.id));
    } else {
      await db.insert(sitePages).values({
        pageKey: input.pageKey,
        draftContent: input.content,
        publishedContent: null,
        status: "draft",
        version: 1,
        updatedBy: input.editor.id,
      });
    }
  } else {
    const current = memoryPages.find((p) => p.pageKey === input.pageKey);
    if (current) {
      current.draftContent = input.content;
      current.version++;
      current.updatedAt = now;
    } else {
      memoryPages.push({
        id: memoryPages.length + 1,
        pageKey: input.pageKey,
        draftContent: input.content,
        publishedContent: null,
        status: "draft",
        version: 1,
        updatedAt: now,
      });
    }
  }
  await recordEdit({ entityType: "page", entityId: input.pageKey, entityLabel: input.pageKey, action: "saved draft", editorEmail: input.editor.email });
}

export async function publishSitePage(pageKey: string, editor: AdminAccount) {
  const now = new Date();
  const db = await getDb();
  if (db) {
    const [page] = await db.select().from(sitePages).where(eq(sitePages.pageKey, pageKey)).limit(1);
    if (!page) throw new Error("Save page content before publishing.");
    await db.update(sitePages).set({ publishedContent: page.draftContent, status: "published", publishedAt: now, updatedBy: editor.id, updatedAt: now }).where(eq(sitePages.id, page.id));
  } else {
    const page = memoryPages.find((p) => p.pageKey === pageKey);
    if (!page) throw new Error("Save page content before publishing.");
    page.publishedContent = page.draftContent;
    page.status = "published";
    page.updatedAt = now;
  }
  await recordEdit({ entityType: "page", entityId: pageKey, entityLabel: pageKey, action: "published", editorEmail: editor.email });
}

export async function getDashboardData() {
  const allProducts = await listAdminProducts();
  const allCategories = await listAdminCategories();
  const categoryById = new Map(allCategories.map((c) => [c.id, c]));
  const warnings: Array<{ productId: number; name: string; slug: string; issues: string[] }> = [];

  for (const product of allProducts) {
    const issues: string[] = [];
    if (!product.name.trim()) issues.push("Missing name");
    if (!product.slug.trim()) issues.push("Missing slug");
    const category = product.categoryId ? categoryById.get(product.categoryId) : null;
    if (!category || !category.active) issues.push("Missing category");
    if (!product.images.length) issues.push("Missing image");
    if (issues.length) warnings.push({ productId: product.id, name: product.name, slug: product.slug, issues });
  }

  return {
    total: allProducts.length,
    drafts: allProducts.filter((r) => r.status === "draft").length,
    published: allProducts.filter((r) => r.status === "published").length,
    recentEdits: memoryEdits.slice(-10),
    warnings,
  };
}

async function recordEdit(input: {
  entityType: string;
  entityId: string;
  entityLabel: string;
  action: string;
  editorEmail: string;
}) {
  const db = await getDb();
  if (db) {
    try {
      await db.insert(contentEdits).values(input);
    } catch {
      // Ignored
    }
  } else {
    memoryEdits.push({ id: memoryEdits.length + 1, ...input, createdAt: new Date() });
  }
}
