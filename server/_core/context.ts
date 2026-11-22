import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User, AdminAccount } from "../../shared/polina-types.js";
import { authenticateAdminRequest } from "./polina-auth.js";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  admin: AdminAccount | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  try {
    const identity = await authenticateAdminRequest(opts.req);
    return {
      req: opts.req,
      res: opts.res,
      user: identity?.user ?? null,
      admin: identity?.admin ?? null,
    };
  } catch {
    console.error("[Auth] Firebase identity lookup failed.");
    return { req: opts.req, res: opts.res, user: null, admin: null };
  }
}
