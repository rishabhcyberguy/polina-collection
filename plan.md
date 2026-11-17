# POLINA Firebase migration plan

## Approved direction and current state

The owner chose: “Firebase Firestore — migrate the server data/admin path to Firebase.” Continue using the existing Firebase project and its explicitly configured named Firestore database; do not switch to `(default)`, seed demonstration content, or copy unknown records. A read-only inventory found `products`, `categories`, `site_content`, `admins`, `site_pages`, and `content_edits` all empty. No `DATABASE_URL` is configured in the Manus workspace, so there is no connected MySQL source to import. The storefront will therefore start with an empty real catalog and show its existing empty states until the owner adds actual content; do not fabricate products or categories.

The Firebase service-account JSON is present only in protected Manus Development storage; its JSON shape and Firebase project match were confirmed without printing any credential values. Development also has the Manus storage credentials needed for product images. Production/Vercel still needs its own protected Firebase and storage values. The owner has not yet provided the verified administrator email and new password; those will be collected only through protected input and used only after exact confirmation.

The original request remains to analyze the supplied project, configure it to run in Manus Preview, make it live on Vercel without deployment errors, and reset administrator credentials to the owner's real credentials. Manus Preview is configured and responding; the supplied homepage edits have been applied and checkpointed. Firestore migration, account provisioning, the user's GitHub synchronization, and Vercel release remain open.

## Current architecture and visual direction

The application is a Vite/React storefront with an Express/tRPC server. Public storefront and SEO endpoints call `server/polina-db.ts`; that adapter currently uses Drizzle/MySQL and silently falls back to in-memory demo records. The admin screen already offers Google/Firebase sign-in, but the server then matches the identity against a MySQL admin table and creates a database-backed session. The non-imported `server/firestore-sync.ts` file contains a sample-data seeder but does not power the running application; it must not be invoked or left as an active initialization path.

Reuse the existing POLINA editorial-fashion visual identity, supplied product imagery, page layouts, and route set, including the verified carousel and intro-text edits. Keep the Google and email/password sign-in choices, but make Firebase Auth the actual identity provider for both. Do not redesign the storefront as part of the persistence migration.

## Implementation approach

### Firestore data path

Replace active MySQL access and the in-memory fallback in `server/polina-db.ts` with typed Firestore reads/writes. Use `@google-cloud/firestore` with the existing explicit database ID and protected service-account credentials; initialize clients lazily at runtime. Use Firebase Admin for Firebase Auth token verification. No credential may appear in source, Vite output, logs, screenshots, or Git.

Preserve the API contracts used by the storefront/admin dashboard: published home content, active categories, published product snapshots, product drafts, image metadata, category administration, product publish/unpublish/archive, page publishing, and recent content edits. Keep stable numeric IDs through Firestore counter documents and reserve product/category slugs transactionally. Keep draft and published snapshots separate so unapproved edits do not leak onto public pages. Store image metadata in Firestore; keep image bytes in the existing Manus storage service. Fail closed when Firebase configuration or Firestore is unavailable; do not return/write in-memory examples in production.

Use the existing collections (`products`, `categories`, `site_content`, `admins`) and add `counters`, `slug_reservations`, and `content_edits` as needed. Read legacy Firestore shapes if present, but because the current database is empty there is no legacy document conversion to run and no automatic seed. Replace the checked-in Firestore rules with default-deny client rules because current public rules expose all product documents, including drafts; all website reads and writes now go through the server. Do not deploy the rule change to the live Firebase project until the owner confirms no other clients depend on the existing public rules.

### Firebase Auth and administrator authorization

Use Firebase client Auth for Google and email/password login. The browser obtains/refreshes the signed-in user's Firebase ID token and sends it as a Bearer token on tRPC requests; passwords never go to the application server. The server verifies token signature, audience, expiry, revocation, and verified-email claim with Firebase Admin, then reads `admins/{uid}` from the configured Firestore database. Admin procedures require an active record with role `admin` and an email matching the verified Firebase identity. Remove the MySQL session/reset-token system and avoid cookie-only authentication; bearer tokens work through the Preview proxy without relying on third-party iframe cookies. Keep public registration disabled.

Use Firebase Auth's email/password reset flow with a neutral response that does not disclose whether an account exists. Firebase Auth sends verification mail for a newly provisioned or unverified owner account; the browser must prevent unverified email accounts from entering admin routes. `auth.me` remains the authoritative role check. Logout clears Firebase client Auth state and query cache.

Replace `scripts/provision-admin.ts` with a non-logging, non-echoing Firebase Auth/Firestore provisioning command. It must require protected owner email/password inputs and an explicit operator confirmation. It may create or update only the named owner account and its `admins/{uid}` record; it must not deactivate unrelated administrators. The user has not yet supplied these values or confirmed the exact email payload.

### Vercel and runtime

Vercel is the selected production host. Preserve the existing Express Function plus CDN-asset build, 3 MiB image limit, SEO routing, and application entrypoint. Ensure the production health endpoint returns success only when its server runtime can reach the configured Firestore, Firebase Auth, and approved media service. Keep runtime secrets out of build output. Production requires the Firebase service-account JSON for Firestore/Auth. The current product-image flow uses Manus Storage, while a read-only metadata request for the configured Firebase Storage bucket returned 404. Do not transfer Manus storage credentials to Vercel or create a storage bucket until the owner chooses the production media backend; image upload/redirect readiness remains a deployment prerequisite. The public `FIREBASE_PROJECT_ID` and `FIRESTORE_DATABASE_ID` can default to the checked-in public Firebase configuration; support nonsecret overrides for environments that intentionally differ.

The project is pinned to Node.js `22.x`, matching the tested Manus runtime (22.23.4) and avoiding Vercel's newer default major. Keep package/lockfiles synchronized and preserve the reviewed lifecycle-script policy.

After migration and checks, synchronize the reviewed source to the existing GitHub repository, connect that GitHub source to a new Vercel project, configure production secrets through Vercel's protected controls, and publish only when Firebase and the owner-approved image-storage runtime inputs are available. No matching POLINA Vercel project currently exists. Do not report a successful Vercel URL until a production deployment succeeds.

## Project structure

- `server/firebase-services.ts`: lazy Firebase Admin Auth and named Firestore client initialization from protected runtime values.
- `server/polina-db.ts`: Firestore-backed catalog, category, page, publication, image-metadata, counter, and audit operations preserving current tRPC shapes.
- `shared/polina-types.ts`: shared admin, product, category, image, page, and published-snapshot types independent of Drizzle.
- `server/_core/context.ts` and `server/_core/trpc.ts`: verified Firebase identity and admin-only procedure guard.
- `server/routers.ts`: existing public/admin routes with Firebase-backed role checks and reset/link behavior.
- `src/lib/firebase.ts`, `src/main.tsx`, and admin login/reset components: Firebase client login, refreshed ID-token headers, email verification, password reset, and client logout.
- `scripts/provision-admin.ts`: protected owner-only Firebase Auth credential and Firestore role provisioning.
- `firestore.rules`: deny all direct browser access because application data flows through the trusted server; do not deploy this rule change to the live Firebase project without separate owner authorization.
- `docs/`, `.env.example`, `README.md`, `package.json`, and `vercel.json`: document actual runtime inputs and preserve the Express/CDN deployment contract.

## Dependencies and source references

Use the pinned pnpm toolchain. `firebase-admin` and `@google-cloud/firestore` are direct dependencies; add any directly imported auth library explicitly and keep the lockfile synchronized. Research findings and official source links are recorded in [docs/firestore-migration-research.md](docs/firestore-migration-research.md). Material constraints are the named database, IAM-authorized server access, server-side ID-token verification, protected service-account handling, no automatic sample data, and separate Manus storage credentials for production media operations.
