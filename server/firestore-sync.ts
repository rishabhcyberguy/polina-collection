import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
  type Firestore,
} from "firebase/firestore";
import fs from "fs";
import path from "path";

// Load configuration securely
let firebaseConfig: Record<string, string> = {};
try {
  const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch {
  // Ignored if file cannot be read
}

// Initialize Firebase App and Firestore for server-side persistence
const app = !getApps().length && firebaseConfig.projectId ? initializeApp(firebaseConfig) : getApp();
export const firestoreDb: Firestore | null = firebaseConfig.projectId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : null;

export interface FirestoreProductDoc {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  featured: boolean;
  informationalOnly: boolean;
  status: "published" | "draft" | "archived";
  publishedSlug: string;
  amazonUrl: string;
  flipkartUrl: string;
  images: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreCategoryDoc {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreSiteContentDoc {
  heroHeading: string;
  heroDescription: string;
  heroCtaLabel: string;
  heroCtaTarget: string;
  editorialHeading: string;
  editorialBody: string;
  footerNote: string;
  contactLinks: string;
  featuredProductIds: string;
  updatedAt: string;
}

/**
 * Seed initial catalog, categories, site content, and admin record to Firestore
 * if the database is currently empty.
 */
export async function seedFirestoreIfEmpty() {
  if (!firestoreDb) return;
  try {
    const productsSnap = await getDocs(collection(firestoreDb, "products"));
    if (productsSnap.empty) {
      console.log("[FIREBASE] Initializing Firestore catalog collections...");

      // 1. Categories
      const initialCategories: FirestoreCategoryDoc[] = [
        { id: "1", name: "Co-Ord Set", slug: "co-ord-set", sortOrder: 1, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "2", name: "Nightwear", slug: "nightwear", sortOrder: 2, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "3", name: "Robes & Lounge", slug: "robes-lounge", sortOrder: 3, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];

      for (const cat of initialCategories) {
        await setDoc(doc(firestoreDb, "categories", cat.id), cat);
      }

      // 2. Initial Product
      const initialProduct: FirestoreProductDoc = {
        id: "1",
        name: "Dark Velour Set",
        slug: "dark-velour-set",
        description: "Premium tactile velour tracksuit designed with contemporary editorial proportions. Features an architectural high-collar silhouette, deep obsidian velour finish, and tailored cuffs for uncompromising presence.",
        categoryId: "1",
        categoryName: "Co-Ord Set",
        featured: true,
        informationalOnly: true,
        status: "published",
        publishedSlug: "dark-velour-set",
        amazonUrl: "",
        flipkartUrl: "",
        images: JSON.stringify([
          { url: "/assets/aistudio/DSC00916_copy_c03a84f5.jpg", altText: "POLINA Dark Velour Set — Front Silhouette" },
          { url: "/assets/aistudio/DSC00922_copy_12df23bb.jpg", altText: "POLINA Dark Velour Set — Tactile Texture & Editorial Detail" },
        ]),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(firestoreDb, "products", initialProduct.id), initialProduct);

      // 3. Site Editorial Content
      const initialContent: FirestoreSiteContentDoc = {
        heroHeading: "POLINA",
        heroDescription: "Sensorial luxury and editorial nightwear silhouettes crafted for uncompromising presence.",
        heroCtaLabel: "Explore the collection",
        heroCtaTarget: "/collections",
        editorialHeading: "Made for your own kind of night.",
        editorialBody: "Tactile expression and modern silhouettes. POLINA curates nightwear and elevated loungewear with bold editorial distinction.",
        footerNote: "POLINA STUDIOS · ALL RIGHTS RESERVED",
        contactLinks: JSON.stringify([
          { label: "Email Us", href: "mailto:skfasionmart@gmail.com", icon: "email" },
          { label: "Call / WhatsApp", href: "tel:+919560849553", icon: "phone" },
          { label: "Amazon Store", href: "https://www.amazon.in/storefront?me=A12LTZ308EZ348&ref_=ssf_share", icon: "amazon" },
          { label: "Flipkart Store", href: "https://www.flipkart.com/search?q=polina+women+nighty&as=on&as-show=on&otracker=AS_Query_OrganicAutoSuggest_1_13_na_na_na&otracker1=AS_Query_OrganicAutoSuggest_1_13_na_na_na&as-pos=1&as-type=RECENT&suggestionId=polina+women+nighty&requestId=0c69e4f3-be2a-4be8-80b6-46eac4b951ce&as-searchtext=polina%20womens", icon: "flipkart" },
          { label: "Instagram", href: "https://www.instagram.com/polina_fashion7/", icon: "instagram" },
        ]),
        featuredProductIds: "[1]",
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(firestoreDb, "site_content", "home"), initialContent);

      // 4. Admin Profile Document
      await setDoc(doc(firestoreDb, "admins", "admin-rishabh"), {
        email: "rishabhkp162012@gmail.com",
        role: "admin",
        active: true,
        createdAt: new Date().toISOString(),
      });

      console.log("[FIREBASE] Seeded Firestore successfully.");
    }
  } catch (error) {
    console.warn("[FIREBASE] Firestore seeding non-fatal error:", (error as Error).message);
  }
}

/**
 * Sync a product to Firestore
 */
export async function syncProductToFirestore(product: FirestoreProductDoc) {
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, "products", String(product.id)), product, { merge: true });
  } catch (error) {
    console.error("[FIREBASE] Failed to sync product to Firestore:", (error as Error).message);
  }
}

/**
 * Remove a product from Firestore
 */
export async function deleteProductFromFirestore(productId: string | number) {
  if (!firestoreDb) return;
  try {
    await deleteDoc(doc(firestoreDb, "products", String(productId)));
  } catch (error) {
    console.error("[FIREBASE] Failed to delete product from Firestore:", (error as Error).message);
  }
}

/**
 * Sync a category to Firestore
 */
export async function syncCategoryToFirestore(category: FirestoreCategoryDoc) {
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, "categories", String(category.id)), category, { merge: true });
  } catch (error) {
    console.error("[FIREBASE] Failed to sync category to Firestore:", (error as Error).message);
  }
}

/**
 * Sync site content to Firestore
 */
export async function syncSiteContentToFirestore(content: FirestoreSiteContentDoc) {
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, "site_content", "home"), content, { merge: true });
  } catch (error) {
    console.error("[FIREBASE] Failed to sync site content to Firestore:", (error as Error).message);
  }
}
