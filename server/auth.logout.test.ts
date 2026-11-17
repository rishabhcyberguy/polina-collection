import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { AdminAccount, User } from "../shared/polina-types";

function createContext(isAdmin: boolean): TrpcContext {
  const now = new Date();
  const admin: AdminAccount | null = isAdmin ? {
    id: 1,
    uid: "firebase-test-uid",
    email: "owner@example.test",
    name: "Owner",
    role: "admin",
    active: true,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  } : null;
  const user: User | null = admin ? {
    id: admin.id,
    openId: admin.uid,
    name: admin.name,
    email: admin.email,
    loginMethod: "firebase",
    role: "admin",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  } : null;

  return {
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    user,
    admin,
  };
}

describe("Firebase-backed admin authorization", () => {
  it("returns the verified administrator identity from auth.me", async () => {
    const caller = appRouter.createCaller(createContext(true));
    await expect(caller.auth.me()).resolves.toEqual({
      id: 1,
      name: "Owner",
      email: "owner@example.test",
      role: "admin",
    });
  });

  it("rejects admin procedures when no active administrator is present in context", async () => {
    const caller = appRouter.createCaller(createContext(false));
    await expect(caller.admin.dashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
