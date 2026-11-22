import type { Request } from "express";
import type { User } from "../../shared/polina-types.js";
import { findAdminByUid } from "../polina-db.js";
import { getFirebaseAdminAuth } from "../firebase-services.js";

export type AuthenticatedAdmin = {
  admin: NonNullable<Awaited<ReturnType<typeof findAdminByUid>>>;
  user: User;
};

function readBearerToken(req: Request) {
  const value = req.headers.authorization;
  if (typeof value !== "string" || !value.startsWith("Bearer ")) return null;
  const token = value.slice(7).trim();
  return token.length >= 32 && token.length <= 8_192 ? token : null;
}

async function resolveVerifiedAdmin(idToken: string): Promise<AuthenticatedAdmin | null> {
  let claims;
  try {
    claims = await getFirebaseAdminAuth().verifyIdToken(idToken, true);
  } catch {
    return null;
  }

  const uid = typeof claims.uid === "string" ? claims.uid : "";
  const email = typeof claims.email === "string" ? claims.email.trim().toLowerCase() : "";
  if (!uid || !email || claims.email_verified !== true) return null;

  const admin = await findAdminByUid(uid);
  if (!admin || !admin.active || admin.role !== "admin" || admin.uid !== uid || admin.email.toLowerCase() !== email) {
    return null;
  }

  const user: User = {
    id: admin.id,
    openId: uid,
    name: admin.name ?? (typeof claims.name === "string" ? claims.name : null),
    email,
    loginMethod: "firebase",
    role: "admin",
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
    lastSignedIn: admin.lastSignedIn ?? admin.createdAt,
  };
  return { admin, user };
}

export async function authenticateAdminRequest(req: Request): Promise<AuthenticatedAdmin | null> {
  const token = readBearerToken(req);
  if (!token) return null;
  return resolveVerifiedAdmin(token);
}
