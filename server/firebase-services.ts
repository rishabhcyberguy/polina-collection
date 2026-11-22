import { Firestore } from "@google-cloud/firestore";
import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import firebaseConfig from "../firebase-applet-config.json" with { type: "json" };

type DownloadedServiceAccount = {
  project_id?: unknown;
  client_email?: unknown;
  private_key?: unknown;
};

type FirebaseRuntimeConfig = {
  projectId: string;
  databaseId: string;
  clientEmail: string;
  privateKey: string;
  serviceAccount: ServiceAccount;
};

let cachedConfig: FirebaseRuntimeConfig | null = null;
let adminApp: App | null = null;
let authClient: Auth | null = null;
let firestoreClient: Firestore | null = null;

function runtimeConfig(): FirebaseRuntimeConfig {
  if (cachedConfig) return cachedConfig;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is required for the server Firebase runtime.");
  }

  let parsed: DownloadedServiceAccount;
  try {
    parsed = JSON.parse(raw) as DownloadedServiceAccount;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must contain the downloaded service-account JSON.");
  }

  const clientEmail = typeof parsed.client_email === "string" ? parsed.client_email.trim() : "";
  const privateKey = typeof parsed.private_key === "string" ? parsed.private_key.replace(/\\n/g, "\n").trim() : "";
  const serviceProjectId = typeof parsed.project_id === "string" ? parsed.project_id.trim() : "";
  const configuredProjectId = process.env.FIREBASE_PROJECT_ID?.trim() || firebaseConfig.projectId;
  const databaseId = process.env.FIRESTORE_DATABASE_ID?.trim() || firebaseConfig.firestoreDatabaseId;

  if (!clientEmail || !privateKey || !serviceProjectId) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing required service-account fields.");
  }
  if (!configuredProjectId || configuredProjectId !== serviceProjectId) {
    throw new Error("The Firebase server credential project must match FIREBASE_PROJECT_ID and the browser Firebase project.");
  }
  if (!databaseId || databaseId === "(default)") {
    throw new Error("FIRESTORE_DATABASE_ID must identify the configured named Firestore database.");
  }

  cachedConfig = {
    projectId: configuredProjectId,
    databaseId,
    clientEmail,
    privateKey,
    serviceAccount: {
      projectId: configuredProjectId,
      clientEmail,
      privateKey,
    },
  };
  return cachedConfig;
}

function getAdminApp(): App {
  if (adminApp) return adminApp;
  const existing = getApps().find((candidate) => candidate.name === "polina-server");
  if (existing) {
    adminApp = existing;
    return existing;
  }

  const config = runtimeConfig();
  adminApp = initializeApp({
    credential: cert(config.serviceAccount),
    projectId: config.projectId,
  }, "polina-server");
  return adminApp;
}

export function getFirebaseAdminAuth(): Auth {
  if (!authClient) authClient = getAuth(getAdminApp());
  return authClient;
}

export function getFirestoreDb(): Firestore {
  if (firestoreClient) return firestoreClient;
  const config = runtimeConfig();
  firestoreClient = new Firestore({
    projectId: config.projectId,
    databaseId: config.databaseId,
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey,
    },
  });
  return firestoreClient;
}

export function getFirebaseStorageBucket() {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET?.trim() || firebaseConfig.storageBucket?.trim();
  if (!bucketName) {
    throw new Error("FIREBASE_STORAGE_BUCKET or firebase-applet-config.json storageBucket is required.");
  }
  return getStorage(getAdminApp()).bucket(bucketName);
}

export async function checkFirebaseStorage() {
  const bucket = getFirebaseStorageBucket();
  await bucket.getMetadata();
  return { bucket: bucket.name };
}

export async function checkFirebaseServices() {
  const db = getFirestoreDb();
  // A read-only query proves the configured database is reachable without
  // creating a health document or using Firestore's reserved __*__ namespace.
  await db.collection("products").limit(1).get();
  return { projectId: runtimeConfig().projectId, databaseId: runtimeConfig().databaseId };
}
