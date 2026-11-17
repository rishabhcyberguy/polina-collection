import { getFirebaseAdminAuth, getFirestoreDb } from "../server/firebase-services";

type AdminDocument = {
  id?: unknown;
  uid?: unknown;
  email?: unknown;
  name?: unknown;
  role?: unknown;
  active?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  lastSignedIn?: unknown;
};

function validatedInputs() {
  if (!process.argv.includes("--confirm-owner")) {
    throw new Error("Pass --confirm-owner only after the owner email and password have been entered through protected inputs.");
  }
  const email = process.env.POLINA_ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const password = process.env.POLINA_ADMIN_PASSWORD ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    throw new Error("The protected POLINA_ADMIN_EMAIL input is missing or invalid.");
  }
  if (password.length < 12 || password.length > 128) {
    throw new Error("The protected POLINA_ADMIN_PASSWORD input must be 12–128 characters.");
  }
  return { email, password };
}

async function findOrCreateAuthUser(email: string, password: string) {
  const auth = getFirebaseAdminAuth();
  try {
    const user = await auth.getUserByEmail(email);
    return await auth.updateUser(user.uid, { password, disabled: false });
  } catch (error) {
    if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
  }
  return auth.createUser({ email, password, emailVerified: false, disabled: false });
}

async function saveAdminRecord(uid: string, email: string, name: string | null) {
  const db = getFirestoreDb();
  const admins = db.collection("admins");
  const ownerRef = admins.doc(uid);
  const counterRef = db.collection("counters").doc("admins");
  const now = new Date();

  await db.runTransaction(async (transaction) => {
    const [ownerSnapshot, counterSnapshot, allAdmins] = await Promise.all([
      transaction.get(ownerRef),
      transaction.get(counterRef),
      transaction.get(admins.limit(500)),
    ]);
    if (allAdmins.size === 500 && !counterSnapshot.exists) {
      throw new Error("The administrators counter must be initialized before provisioning an account.");
    }

    const existing = (ownerSnapshot.data() ?? {}) as AdminDocument;
    let maximumId = 0;
    for (const snapshot of allAdmins.docs) {
      const data = snapshot.data() as AdminDocument;
      const id = typeof data.id === "number" ? data.id : Number(data.id ?? snapshot.id);
      if (Number.isFinite(id)) maximumId = Math.max(maximumId, id);
    }
    const nextId = typeof existing.id === "number"
      ? existing.id
      : Math.max(maximumId, Number(counterSnapshot.data()?.value ?? 0)) + 1;

    if (!counterSnapshot.exists || nextId > Number(counterSnapshot.data()?.value ?? 0)) {
      transaction.set(counterRef, { value: nextId, updatedAt: now });
    }
    transaction.set(ownerRef, {
      id: nextId,
      uid,
      email,
      name: name ?? (typeof existing.name === "string" ? existing.name : null),
      role: "admin",
      active: true,
      createdAt: existing.createdAt ?? now,
      updatedAt: now,
      lastSignedIn: existing.lastSignedIn ?? null,
    });
  });
}

async function main() {
  const { email, password } = validatedInputs();
  const user = await findOrCreateAuthUser(email, password);
  await saveAdminRecord(user.uid, email, user.displayName ?? null);
  console.log("Firebase Auth credentials and the matching POLINA administrator record were updated.");
  if (!user.emailVerified) {
    console.log("The account must verify its email before it can enter the admin portal.");
  }
}

main().catch(() => {
  console.error("Administrator provisioning failed. Check the protected inputs and Firebase Auth/Firestore permissions.");
  process.exitCode = 1;
});
