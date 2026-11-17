import type { DocumentData, DocumentReference, Firestore, QueryDocumentSnapshot, Transaction } from "@google-cloud/firestore";
import type {
  AdminAccount,
  Category,
  ContentEdit,
  Product,
  ProductImage,
  ProductStatus,
  PublishedProductSnapshot,
  SiteContent,
  SitePage,
} from "../shared/polina-types";
import { getFirestoreDb } from "./firebase-services";

const CATEGORIES = "categories";
const PRODUCTS = "products";
const SITE_PAGES = "site_pages";
const PUBLIC_SITE_CONTENT = "site_content";
const ADMINS = "admins";
const COUNTERS = "counters";
const SLUG_RESERVATIONS = "slug_reservations";
const CONTENT_EDITS = "content_edits";

type Data = Record<string, unknown>;
type ProductWithCategory = Product & { category: Category | null };
type PublishedProduct = PublishedProductSnapshot & { id: number; publishedAt: Date | null };

function record(value: unknown): Data {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Data : {};
}

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function nullableText(value: unknown): string | null {
  return typeof value === "string" && value.length ? value : null;
}

function numberValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return fallback;
}

function booleanValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function dateValue(value: unknown, fallback = new Date()): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const result = value.toDate();
    if (result instanceof Date && !Number.isNaN(result.getTime())) return result;
  }
  if (typeof value === "string" || typeof value === "number") {
    const result = new Date(value);
    if (!Number.isNaN(result.getTime())) return result;
  }
  return fallback;
}

function nullableDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  return dateValue(value, new Date(0));
}

function documentIdNumber(id: string, data: Data) {
  return numberValue(data.id, numberValue(id, 0));
}

function parseImages(value: unknown): Array<{ url: string; altText: string }> {
  const candidate = parseJson(value);
  if (!Array.isArray(candidate)) return [];
  return candidate.flatMap((item) => {
    const image = record(item);
    const url = text(image.url);
    if (!url) return [];
    return [{ url, altText: text(image.altText, text(image.alt, "Product image")) }];
  });
}

function parseSnapshot(value: unknown): PublishedProductSnapshot | null {
  const snapshot = record(parseJson(value));
  const name = text(snapshot.name);
  const slug = text(snapshot.slug);
  if (!name || !slug) return null;
  const images = parseImages(snapshot.images);
  return {
    name,
    slug,
    description: text(snapshot.description),
    categoryId: numberValue(snapshot.categoryId),
    categoryName: text(snapshot.categoryName),
    categorySlug: text(snapshot.categorySlug),
    featured: booleanValue(snapshot.featured),
    informationalOnly: booleanValue(snapshot.informationalOnly),
    amazonUrl: nullableText(snapshot.amazonUrl),
    flipkartUrl: nullableText(snapshot.flipkartUrl),
    images,
  };
}

const CONTACT_ICONS = new Set([
  "email", "amazon", "flipkart", "instagram", "facebook", "linkedin",
  "twitter", "github", "discord", "phone", "other",
]);

function parseSiteContent(value: unknown): SiteContent | null {
  const parsed = record(parseJson(value));
  const heroHeading = text(parsed.heroHeading);
  const heroDescription = text(parsed.heroDescription);
  const heroCtaLabel = text(parsed.heroCtaLabel);
  const heroCtaTarget = text(parsed.heroCtaTarget);
  const editorialHeading = text(parsed.editorialHeading);
  const editorialBody = text(parsed.editorialBody);
  const footerNote = text(parsed.footerNote);
  if (!heroHeading || !heroCtaLabel || !heroCtaTarget) return null;

  const contactValues = parseJson(parsed.contactLinks);
  const contactLinks = Array.isArray(contactValues)
    ? contactValues.flatMap((item) => {
        const link = record(item);
        const label = text(link.label);
        const href = text(link.href);
        if (!label || !href) return [];
        const icon = text(link.icon, "other");
        return [{ label, href, icon: CONTACT_ICONS.has(icon) ? icon as SiteContent["contactLinks"][number]["icon"] : "other" as const }];
      })
    : [];
  const featuredValues = parseJson(parsed.featuredProductIds);
  const featuredProductIds = Array.isArray(featuredValues)
    ? featuredValues.map((id) => numberValue(id, -1)).filter((id) => Number.isInteger(id) && id > 0)
    : [];

  return {
    heroHeading,
    heroDescription,
    heroCtaLabel,
    heroCtaTarget,
    editorialHeading,
    editorialBody,
    footerNote,
    contactLinks,
    featuredProductIds,
  };
}

function mapCategory(snapshot: QueryDocumentSnapshot<DocumentData>): Category {
  const data = snapshot.data() as Data;
  const now = new Date();
  return {
    id: documentIdNumber(snapshot.id, data),
    name: text(data.name),
    slug: text(data.slug),
    sortOrder: numberValue(data.sortOrder),
    active: booleanValue(data.active, true),
    createdAt: dateValue(data.createdAt, now),
    updatedAt: dateValue(data.updatedAt, now),
  };
}

function mapImage(snapshot: QueryDocumentSnapshot<DocumentData>, productId: number): ProductImage {
  const data = snapshot.data() as Data;
  return {
    id: documentIdNumber(snapshot.id, data),
    productId: numberValue(data.productId, productId),
    storageKey: text(data.storageKey),
    url: text(data.url),
    altText: text(data.altText),
    sortOrder: numberValue(data.sortOrder),
    createdAt: dateValue(data.createdAt),
  };
}

function mapProductData(id: string, data: Data): Product {
  const statusValue = text(data.status, "draft");
  const status: ProductStatus = statusValue === "published" || statusValue === "archived" ? statusValue : "draft";
  const snapshot = parseSnapshot(data.publishedData) ?? (status === "published" && text(data.name) && text(data.slug) ? {
    name: text(data.name),
    slug: text(data.slug),
    description: text(data.description),
    categoryId: numberValue(data.categoryId),
    categoryName: text(data.categoryName),
    categorySlug: text(data.categorySlug),
    featured: booleanValue(data.featured),
    informationalOnly: booleanValue(data.informationalOnly),
    amazonUrl: nullableText(data.amazonUrl),
    flipkartUrl: nullableText(data.flipkartUrl),
    images: parseImages(data.images),
  } satisfies PublishedProductSnapshot : null);
  return {
    id: documentIdNumber(id, data),
    name: text(data.name),
    slug: text(data.slug),
    description: text(data.description),
    categoryId: data.categoryId === null || data.categoryId === undefined ? null : numberValue(data.categoryId, 0),
    featured: booleanValue(data.featured),
    informationalOnly: booleanValue(data.informationalOnly),
    status,
    hasDraftChanges: booleanValue(data.hasDraftChanges),
    publishedSlug: nullableText(data.publishedSlug) ?? (status === "published" ? text(data.slug) || null : null),
    publishedData: snapshot,
    amazonUrl: nullableText(data.amazonUrl),
    flipkartUrl: nullableText(data.flipkartUrl),
    createdAt: dateValue(data.createdAt),
    updatedAt: dateValue(data.updatedAt),
    createdBy: data.createdBy === null || data.createdBy === undefined ? null : numberValue(data.createdBy, 0),
    updatedBy: data.updatedBy === null || data.updatedBy === undefined ? null : numberValue(data.updatedBy, 0),
    publishedAt: nullableDate(data.publishedAt),
    images: [],
  };
}

function mapAdmin(snapshot: QueryDocumentSnapshot<DocumentData> | { id: string; data(): DocumentData }): AdminAccount | null {
  const data = snapshot.data() as Data;
  const email = text(data.email).trim().toLowerCase();
  const id = documentIdNumber(snapshot.id, data);
  if (!email || id <= 0 || data.role !== "admin" || data.active !== true) return null;
  const now = new Date();
  return {
    id,
    uid: text(data.uid, snapshot.id),
    email,
    name: nullableText(data.name ?? data.displayName),
    role: "admin",
    active: true,
    createdAt: dateValue(data.createdAt, now),
    updatedAt: dateValue(data.updatedAt, now),
    lastSignedIn: nullableDate(data.lastSignedIn),
  };
}

function mapContentEdit(snapshot: QueryDocumentSnapshot<DocumentData>): ContentEdit {
  const data = snapshot.data() as Data;
  return {
    id: documentIdNumber(snapshot.id, data),
    entityType: text(data.entityType),
    entityId: text(data.entityId),
    entityLabel: text(data.entityLabel),
    action: text(data.action),
    editorEmail: text(data.editorEmail),
    createdAt: dateValue(data.createdAt),
  };
}

function slugReservation(db: Firestore, kind: string, slug: string): DocumentReference {
  return db.collection(SLUG_RESERVATIONS).doc(`${kind}_${slug}`);
}

async function nextNumericId(counterKey: string, collectionName?: string) {
  const db = getFirestoreDb();
  const counterRef = db.collection(COUNTERS).doc(counterKey);
  return db.runTransaction(async (transaction) => {
    const counterSnapshot = await transaction.get(counterRef);
    let current = numberValue(counterSnapshot.data()?.value);
    if (!counterSnapshot.exists && collectionName) {
      const existing = await transaction.get(db.collection(collectionName).limit(500));
      if (existing.size === 500) {
        throw new Error(`Initialize the ${counterKey} counter before adding more records.`);
      }
      for (const item of existing.docs) {
        const data = item.data() as Data;
        current = Math.max(current, documentIdNumber(item.id, data));
      }
    }
    const next = current + 1;
    transaction.set(counterRef, { value: next, updatedAt: new Date() });
    return next;
  });
}

async function getImages(productId: number, legacyData?: Data) {
  const db = getFirestoreDb();
  const collection = db.collection(PRODUCTS).doc(String(productId)).collection("images");
  const snapshot = await collection.orderBy("sortOrder", "asc").get();
  if (!snapshot.empty) return snapshot.docs.map((item) => mapImage(item, productId));

  const legacyImages = parseImages(legacyData?.images);
  return legacyImages.map((image, index) => ({
    id: index + 1,
    productId,
    storageKey: image.url,
    url: image.url,
    altText: image.altText,
    sortOrder: index + 1,
    createdAt: dateValue(legacyData?.updatedAt),
  }));
}

async function getCategoryMap() {
  const snapshot = await getFirestoreDb().collection(CATEGORIES).get();
  return new Map(snapshot.docs.map((item) => {
    const category = mapCategory(item);
    return [category.id, category] as const;
  }));
}

async function getCategoryById(id: number | null): Promise<Category | null> {
  if (!id) return null;
  const snapshot = await getFirestoreDb().collection(CATEGORIES).doc(String(id)).get();
  return snapshot.exists ? mapCategory(snapshot as QueryDocumentSnapshot<DocumentData>) : null;
}

function productSlugQuery(db: Firestore, slug: string) {
  return db.collection(PRODUCTS).where("slug", "==", slug).limit(2);
}

function categorySlugQuery(db: Firestore, slug: string) {
  return db.collection(CATEGORIES).where("slug", "==", slug).limit(2);
}

async function claimProductSlug(
  transaction: Transaction,
  db: Firestore,
  slug: string,
  productId: number,
  field: "slug" | "publishedSlug",
) {
  const kind = field === "slug" ? "product_draft" : "product_public";
  const reservationRef = slugReservation(db, kind, slug);
  const reservation = await transaction.get(reservationRef);
  const matchingProducts = await transaction.get(db.collection(PRODUCTS).where(field, "==", slug).limit(2));
  const ownerId = String(productId);
  const storedOwner = text(reservation.data()?.ownerId);
  const conflictingProduct = matchingProducts.docs.find((item) => item.id !== ownerId);
  if ((storedOwner && storedOwner !== ownerId) || conflictingProduct) {
    throw new Error("That product slug is already in use.");
  }
  return reservationRef;
}

async function releaseProductSlug(transaction: Transaction, db: Firestore, slug: string | null, productId: number, field: "slug" | "publishedSlug") {
  if (!slug) return;
  const kind = field === "slug" ? "product_draft" : "product_public";
  const ref = slugReservation(db, kind, slug);
  const snapshot = await transaction.get(ref);
  if (text(snapshot.data()?.ownerId) === String(productId)) transaction.delete(ref);
}

async function claimCategorySlug(transaction: Transaction, db: Firestore, slug: string, categoryId: number) {
  const ref = slugReservation(db, "category", slug);
  const reservation = await transaction.get(ref);
  const matches = await transaction.get(categorySlugQuery(db, slug));
  const ownerId = String(categoryId);
  const conflicting = matches.docs.find((item) => item.id !== ownerId);
  const reservedOwner = text(reservation.data()?.ownerId);
  if ((reservedOwner && reservedOwner !== ownerId) || conflicting) {
    throw new Error("That category slug is already in use.");
  }
  return ref;
}

async function releaseCategorySlug(transaction: Transaction, db: Firestore, slug: string, categoryId: number) {
  const ref = slugReservation(db, "category", slug);
  const reservation = await transaction.get(ref);
  if (text(reservation.data()?.ownerId) === String(categoryId)) transaction.delete(ref);
}

async function recordEdit(input: {
  entityType: string;
  entityId: string;
  entityLabel: string;
  action: string;
  editorEmail: string;
}) {
  try {
    const db = getFirestoreDb();
    const id = await nextNumericId("content_edits", CONTENT_EDITS);
    await db.collection(CONTENT_EDITS).doc(String(id)).create({
      id,
      ...input,
      editorEmail: input.editorEmail.trim().toLowerCase(),
      createdAt: new Date(),
    });
  } catch {
    // Content mutations keep their existing behavior if the optional audit write fails.
  }
}

export async function findAdminByUid(uid: string): Promise<AdminAccount | null> {
  if (!uid || uid.length > 128) return null;
  const snapshot = await getFirestoreDb().collection(ADMINS).doc(uid).get();
  return snapshot.exists ? mapAdmin(snapshot as QueryDocumentSnapshot<DocumentData>) : null;
}

export async function updateAdminLastSignedIn(uid: string) {
  const db = getFirestoreDb();
  const reference = db.collection(ADMINS).doc(uid);
  const snapshot = await reference.get();
  if (!snapshot.exists) return;
  await reference.update({ lastSignedIn: new Date(), updatedAt: new Date() });
}

export async function listActiveCategories(): Promise<Category[]> {
  const snapshot = await getFirestoreDb().collection(CATEGORIES).get();
  return snapshot.docs.map(mapCategory).filter((category) => category.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export async function listAdminCategories(): Promise<Category[]> {
  const snapshot = await getFirestoreDb().collection(CATEGORIES).get();
  return snapshot.docs.map(mapCategory).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export async function saveCategory(input: { id?: number; name: string; slug: string; sortOrder: number }) {
  const db = getFirestoreDb();
  const now = new Date();
  const id = input.id ?? await nextNumericId("categories", CATEGORIES);
  const reference = db.collection(CATEGORIES).doc(String(id));

  await db.runTransaction(async (transaction) => {
    const currentSnapshot = await transaction.get(reference);
    if (input.id && !currentSnapshot.exists) throw new Error("Category not found.");
    const current = currentSnapshot.data() as Data | undefined;
    const previousSlug = text(current?.slug);
    const newSlugReservation = await claimCategorySlug(transaction, db, input.slug, id);
    let previousSlugReservation: DocumentReference | null = null;
    if (previousSlug && previousSlug !== input.slug) {
      previousSlugReservation = slugReservation(db, "category", previousSlug);
      const previousReservation = await transaction.get(previousSlugReservation);
      if (text(previousReservation.data()?.ownerId) !== String(id)) previousSlugReservation = null;
    }

    const category: Category = {
      id,
      name: input.name,
      slug: input.slug,
      sortOrder: input.sortOrder,
      active: true,
      createdAt: dateValue(current?.createdAt, now),
      updatedAt: now,
    };
    transaction.set(reference, category);
    transaction.set(newSlugReservation, { ownerId: String(id), updatedAt: now });
    if (previousSlugReservation) transaction.delete(previousSlugReservation);
  });

  return id;
}

export async function archiveCategory(id: number) {
  const db = getFirestoreDb();
  const reference = db.collection(CATEGORIES).doc(String(id));
  const snapshot = await reference.get();
  if (!snapshot.exists) throw new Error("Category not found.");
  await reference.update({ active: false, updatedAt: new Date() });
}

export async function listPublishedProducts(categorySlug?: string): Promise<PublishedProduct[]> {
  const snapshot = await getFirestoreDb().collection(PRODUCTS).get();
  return snapshot.docs.flatMap((item) => {
    const product = mapProductData(item.id, item.data() as Data);
    const published = product.publishedData;
    if (product.status !== "published" || !published || (categorySlug && published.categorySlug !== categorySlug)) return [];
    return [{ id: product.id, ...published, publishedAt: product.publishedAt }];
  }).sort((a, b) => Number(b.featured) - Number(a.featured)
    || (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
}

export async function getPublishedProduct(slug: string): Promise<PublishedProduct | null> {
  const snapshot = await getFirestoreDb().collection(PRODUCTS).where("publishedSlug", "==", slug).limit(1).get();
  const item = snapshot.docs.find((document) => text(document.get("status")) === "published");
  if (!item) return null;
  const product = mapProductData(item.id, item.data() as Data);
  return product.publishedData ? { id: product.id, ...product.publishedData, publishedAt: product.publishedAt } : null;
}

export async function getPublishedPage(pageKey: string): Promise<SiteContent | null> {
  const db = getFirestoreDb();
  const publicSnapshot = await db.collection(PUBLIC_SITE_CONTENT).doc(pageKey).get();
  if (publicSnapshot.exists) {
    const data = publicSnapshot.data() as Data;
    const content = parseSiteContent(data.publishedContent ?? data.content ?? data);
    if (content) return content;
  }

  const privateSnapshot = await db.collection(SITE_PAGES).doc(pageKey).get();
  if (!privateSnapshot.exists) return null;
  const data = privateSnapshot.data() as Data;
  return parseSiteContent(data.publishedContent);
}

export async function getAdminProduct(id: number): Promise<ProductWithCategory | null> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(PRODUCTS).doc(String(id)).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data() as Data;
  const product = mapProductData(snapshot.id, data);
  const [images, category] = await Promise.all([getImages(product.id, data), getCategoryById(product.categoryId)]);
  return { ...product, images, category };
}

export async function listAdminProducts(): Promise<ProductWithCategory[]> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(PRODUCTS).get();
  const categories = await getCategoryMap();
  const activeProducts = snapshot.docs.map((item) => mapProductData(item.id, item.data() as Data))
    .filter((product) => product.status !== "archived")
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return Promise.all(activeProducts.map(async (product) => {
    const source = snapshot.docs.find((item) => item.id === String(product.id))?.data() as Data | undefined;
    const images = await getImages(product.id, source);
    return { ...product, images, category: product.categoryId ? categories.get(product.categoryId) ?? null : null };
  }));
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
  const db = getFirestoreDb();
  const now = new Date();
  const id = input.id ?? await nextNumericId("products", PRODUCTS);
  const reference = db.collection(PRODUCTS).doc(String(id));
  let currentProduct: Product | null = null;

  await db.runTransaction(async (transaction) => {
    const currentSnapshot = await transaction.get(reference);
    if (input.id && !currentSnapshot.exists) throw new Error("Product not found.");
    const currentData = currentSnapshot.exists ? currentSnapshot.data() as Data : null;
    if (currentData && text(currentData.status) === "archived") throw new Error("Product not found.");
    currentProduct = currentData ? mapProductData(reference.id, currentData) : null;

    let categorySnapshot = null;
    if (input.categoryId !== null) {
      categorySnapshot = await transaction.get(db.collection(CATEGORIES).doc(String(input.categoryId)));
      if (!categorySnapshot.exists || categorySnapshot.data()?.active === false) {
        throw new Error("Choose an active category before saving this product.");
      }
    }

    const slugReservationRef = await claimProductSlug(transaction, db, input.slug, id, "slug");
    const previousSlug = currentProduct?.slug ?? null;
    let oldSlugRef: DocumentReference | null = null;
    if (previousSlug && previousSlug !== input.slug) {
      oldSlugRef = slugReservation(db, "product_draft", previousSlug);
      const oldReservation = await transaction.get(oldSlugRef);
      if (text(oldReservation.data()?.ownerId) !== String(id)) oldSlugRef = null;
    }

    const next: Product = {
      id,
      name: input.name,
      slug: input.slug,
      description: input.description,
      categoryId: input.categoryId,
      featured: input.featured,
      informationalOnly: input.informationalOnly,
      status: currentProduct?.status ?? "draft",
      hasDraftChanges: currentProduct?.status === "published",
      publishedSlug: currentProduct?.publishedSlug ?? null,
      publishedData: currentProduct?.publishedData ?? null,
      amazonUrl: input.amazonUrl,
      flipkartUrl: input.flipkartUrl,
      createdAt: currentProduct?.createdAt ?? now,
      updatedAt: now,
      createdBy: currentProduct?.createdBy ?? input.editor.id,
      updatedBy: input.editor.id,
      publishedAt: currentProduct?.publishedAt ?? null,
      images: [],
    };
    transaction.set(reference, next);
    transaction.set(slugReservationRef, { ownerId: String(id), updatedAt: now });
    if (oldSlugRef) transaction.delete(oldSlugRef);
  });

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
  const db = getFirestoreDb();
  const productRef = db.collection(PRODUCTS).doc(String(input.productId));
  const imageId = await nextNumericId("product_images");
  const now = new Date();

  await db.runTransaction(async (transaction) => {
    const productSnapshot = await transaction.get(productRef);
    if (!productSnapshot.exists || text(productSnapshot.data()?.status) === "archived") throw new Error("Product not found.");
    const product = mapProductData(productSnapshot.id, productSnapshot.data() as Data);
    transaction.create(productRef.collection("images").doc(String(imageId)), {
      id: imageId,
      productId: input.productId,
      storageKey: input.storageKey,
      url: input.url,
      altText: input.altText,
      sortOrder: input.sortOrder,
      createdAt: now,
    });
    transaction.update(productRef, {
      hasDraftChanges: product.status === "published" ? true : product.hasDraftChanges,
      updatedAt: now,
    });
  });

  return imageId;
}

export async function updateProductImageAlt(input: { productId: number; imageId: number; altText: string; sortOrder: number }) {
  const db = getFirestoreDb();
  const productRef = db.collection(PRODUCTS).doc(String(input.productId));
  const imageRef = productRef.collection("images").doc(String(input.imageId));
  await db.runTransaction(async (transaction) => {
    const [productSnapshot, imageSnapshot] = await Promise.all([transaction.get(productRef), transaction.get(imageRef)]);
    if (!productSnapshot.exists || !imageSnapshot.exists) throw new Error("Product image not found.");
    const product = mapProductData(productSnapshot.id, productSnapshot.data() as Data);
    transaction.update(imageRef, { altText: input.altText, sortOrder: input.sortOrder });
    transaction.update(productRef, {
      hasDraftChanges: product.status === "published" ? true : product.hasDraftChanges,
      updatedAt: new Date(),
    });
  });
}

export async function removeProductImage(productId: number, imageId: number) {
  const db = getFirestoreDb();
  const productRef = db.collection(PRODUCTS).doc(String(productId));
  const imageRef = productRef.collection("images").doc(String(imageId));
  await db.runTransaction(async (transaction) => {
    const [productSnapshot, imageSnapshot] = await Promise.all([transaction.get(productRef), transaction.get(imageRef)]);
    if (!productSnapshot.exists || !imageSnapshot.exists) throw new Error("Product image not found.");
    const product = mapProductData(productSnapshot.id, productSnapshot.data() as Data);
    transaction.delete(imageRef);
    transaction.update(productRef, {
      hasDraftChanges: product.status === "published" ? true : product.hasDraftChanges,
      updatedAt: new Date(),
    });
  });
}

export async function publishProduct(id: number, editor: AdminAccount) {
  const db = getFirestoreDb();
  const productWithCategory = await getAdminProduct(id);
  if (!productWithCategory || productWithCategory.status === "archived") throw new Error("Product not found.");
  const category = productWithCategory.category;
  if (!productWithCategory.name.trim() || !productWithCategory.slug.trim() || !category?.active || !productWithCategory.images.length) {
    throw new Error("Add a name, unique slug, category, and at least one image before publishing.");
  }

  const snapshot: PublishedProductSnapshot = {
    name: productWithCategory.name,
    slug: productWithCategory.slug,
    description: productWithCategory.description,
    categoryId: category.id,
    categoryName: category.name,
    categorySlug: category.slug,
    featured: productWithCategory.featured,
    informationalOnly: productWithCategory.informationalOnly,
    amazonUrl: productWithCategory.amazonUrl,
    flipkartUrl: productWithCategory.flipkartUrl,
    images: productWithCategory.images.map((image) => ({ url: image.url, altText: image.altText })),
  };
  const productRef = db.collection(PRODUCTS).doc(String(id));
  const publishedReservationRef = slugReservation(db, "product_public", productWithCategory.slug);
  const draftReservationRef = slugReservation(db, "product_draft", productWithCategory.slug);

  await db.runTransaction(async (transaction) => {
    const [currentSnapshot, categorySnapshot, publicReservation, draftReservation, slugMatches] = await Promise.all([
      transaction.get(productRef),
      transaction.get(db.collection(CATEGORIES).doc(String(category.id))),
      transaction.get(publishedReservationRef),
      transaction.get(draftReservationRef),
      transaction.get(db.collection(PRODUCTS).where("publishedSlug", "==", productWithCategory.slug).limit(2)),
    ]);
    if (!currentSnapshot.exists || text(currentSnapshot.data()?.status) === "archived" || !categorySnapshot.exists || categorySnapshot.data()?.active !== true) {
      throw new Error("Product or category is no longer available for publishing.");
    }
    const owner = text(publicReservation.data()?.ownerId);
    const conflict = slugMatches.docs.find((item) => item.id !== String(id));
    if ((owner && owner !== String(id)) || conflict) throw new Error("That published product slug is already in use.");

    const current = mapProductData(currentSnapshot.id, currentSnapshot.data() as Data);
    if (current.publishedSlug && current.publishedSlug !== productWithCategory.slug) {
      const oldPublicRef = slugReservation(db, "product_public", current.publishedSlug);
      const oldPublic = await transaction.get(oldPublicRef);
      if (text(oldPublic.data()?.ownerId) === String(id)) transaction.delete(oldPublicRef);
    }
    transaction.set(publishedReservationRef, { ownerId: String(id), updatedAt: new Date() });
    if (!draftReservation.exists) transaction.set(draftReservationRef, { ownerId: String(id), updatedAt: new Date() });
    transaction.update(productRef, {
      status: "published",
      publishedSlug: productWithCategory.slug,
      publishedData: snapshot,
      hasDraftChanges: false,
      publishedAt: new Date(),
      updatedBy: editor.id,
      updatedAt: new Date(),
    });
  });

  await recordEdit({ entityType: "product", entityId: String(id), entityLabel: productWithCategory.name, action: "published", editorEmail: editor.email });
}

async function setProductUnpublished(id: number, editor: AdminAccount, archive = false) {
  const db = getFirestoreDb();
  const reference = db.collection(PRODUCTS).doc(String(id));
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) throw new Error("Product not found.");
    const product = mapProductData(snapshot.id, snapshot.data() as Data);
    await releaseProductSlug(transaction, db, product.publishedSlug, id, "publishedSlug");
    transaction.update(reference, {
      status: archive ? "archived" : "draft",
      publishedSlug: null,
      publishedData: null,
      hasDraftChanges: false,
      publishedAt: null,
      updatedBy: editor.id,
      updatedAt: new Date(),
    });
  });
  await recordEdit({ entityType: "product", entityId: String(id), entityLabel: String(id), action: archive ? "archived" : "unpublished", editorEmail: editor.email });
}

export async function unpublishProduct(id: number, editor: AdminAccount) {
  return setProductUnpublished(id, editor, false);
}

export async function archiveProduct(id: number, editor: AdminAccount) {
  return setProductUnpublished(id, editor, true);
}

export async function getAdminSitePage(pageKey: string): Promise<SitePage | null> {
  const db = getFirestoreDb();
  const pageSnapshot = await db.collection(SITE_PAGES).doc(pageKey).get();
  if (pageSnapshot.exists) {
    const data = pageSnapshot.data() as Data;
    const draftContent = parseSiteContent(data.draftContent);
    if (!draftContent) return null;
    return {
      id: documentIdNumber(pageSnapshot.id, data),
      pageKey,
      draftContent,
      publishedContent: parseSiteContent(data.publishedContent),
      status: text(data.status) === "published" ? "published" : "draft",
      version: Math.max(1, numberValue(data.version, 1)),
      updatedAt: dateValue(data.updatedAt),
      updatedBy: data.updatedBy === null || data.updatedBy === undefined ? null : numberValue(data.updatedBy, 0),
      publishedAt: nullableDate(data.publishedAt),
    };
  }

  const publicSnapshot = await db.collection(PUBLIC_SITE_CONTENT).doc(pageKey).get();
  if (!publicSnapshot.exists) return null;
  const publicData = publicSnapshot.data() as Data;
  const content = parseSiteContent(publicData.publishedContent ?? publicData.content ?? publicData);
  if (!content) return null;
  const now = dateValue(publicData.updatedAt);
  return {
    id: 0,
    pageKey,
    draftContent: content,
    publishedContent: content,
    status: "published",
    version: 1,
    updatedAt: now,
    updatedBy: null,
    publishedAt: nullableDate(publicData.publishedAt) ?? now,
  };
}

export async function saveSitePage(input: { pageKey: string; content: SiteContent; editor: AdminAccount }) {
  const db = getFirestoreDb();
  const reference = db.collection(SITE_PAGES).doc(input.pageKey);
  const existingSnapshot = await reference.get();
  const id = existingSnapshot.exists ? documentIdNumber(reference.id, existingSnapshot.data() as Data) : await nextNumericId("site_pages", SITE_PAGES);
  const now = new Date();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    const current = snapshot.exists ? snapshot.data() as Data : {};
    const publishedContent = parseSiteContent(current.publishedContent);
    const data = {
      id,
      pageKey: input.pageKey,
      draftContent: input.content,
      publishedContent,
      status: publishedContent ? "published" : "draft",
      version: Math.max(0, numberValue(current.version)) + 1,
      createdAt: dateValue(current.createdAt, now),
      updatedAt: now,
      updatedBy: input.editor.id,
      publishedAt: nullableDate(current.publishedAt),
    };
    transaction.set(reference, data);
  });

  await recordEdit({ entityType: "page", entityId: input.pageKey, entityLabel: input.pageKey, action: "saved draft", editorEmail: input.editor.email });
}

export async function publishSitePage(pageKey: string, editor: AdminAccount) {
  const db = getFirestoreDb();
  const reference = db.collection(SITE_PAGES).doc(pageKey);
  const now = new Date();
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) throw new Error("Save page content before publishing.");
    const data = snapshot.data() as Data;
    const draftContent = parseSiteContent(data.draftContent);
    if (!draftContent) throw new Error("Save valid page content before publishing.");
    transaction.set(reference, {
      ...data,
      publishedContent: draftContent,
      status: "published",
      publishedAt: now,
      updatedAt: now,
      updatedBy: editor.id,
    });
    transaction.set(db.collection(PUBLIC_SITE_CONTENT).doc(pageKey), {
      ...draftContent,
      publishedAt: now,
      updatedAt: now,
    });
  });
  await recordEdit({ entityType: "page", entityId: pageKey, entityLabel: pageKey, action: "published", editorEmail: editor.email });
}

export async function getDashboardData() {
  const allProducts = await listAdminProducts();
  const allCategories = await listAdminCategories();
  const categoryById = new Map(allCategories.map((category) => [category.id, category]));
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

  const recentSnapshot = await getFirestoreDb().collection(CONTENT_EDITS).orderBy("createdAt", "desc").limit(10).get();
  const recentEdits = recentSnapshot.docs.map(mapContentEdit);
  return {
    total: allProducts.length,
    drafts: allProducts.filter((product) => product.status === "draft").length,
    published: allProducts.filter((product) => product.status === "published").length,
    recentEdits,
    warnings,
  };
}
