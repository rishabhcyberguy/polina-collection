# POLINA on Vercel: runtime and storage notes

## Verified platform behavior

Vercel's Express guide supports a default-exported Express application from a root `index.ts` entry. The Express application becomes one Vercel Function. Vercel serves static assets from the deployment's root `public/` directory through its CDN; `express.static()` does not serve those assets there. A function can include additional files using `includeFiles` in `vercel.json`.

Vercel Functions currently impose a 4.5 MB maximum request-body and response-body size. A 3 MiB image becomes about 4 MiB when encoded as base64, leaving room for the surrounding JSON and tRPC envelope. POLINA therefore enforces a 3 MiB image limit and uses an Express parser ceiling of 4.3 MB for the Vercel runtime. The regular local/Manus listener remains a separate entrypoint.

## POLINA runtime and data path

Vite builds into `dist/public`. The Vercel build command stages hashed assets into the deployment root `public/` directory only when running as a Vercel deployment; ordinary local builds preserve the source `public/` tree. The Vercel Express Function includes the HTML shell for route-aware responses. Do not add a catch-all rewrite to `/index.html`: requests must reach Express for `/api/*`, SEO documents, media redirects, and app routes. Vercel Preview responses are marked `noindex`; production canonical metadata uses `PUBLIC_APP_ORIGIN` or the Vercel production deployment origin.

The active application server uses Firebase Authentication for identity and the existing named Firestore database for admin roles, catalog, pages, image metadata, and audit records. The server verifies Firebase ID tokens and requires an active `admins/{uid}` record. It does not use MySQL or in-memory catalog fallback. The checked-in `firestore.rules` are default-deny for direct browser access; they have not been deployed. Confirm that no other clients rely on the current Firebase rules before deploying changes.

Vercel runtime requires `FIREBASE_SERVICE_ACCOUNT_JSON` in protected environment variables. `FIREBASE_PROJECT_ID` and `FIRESTORE_DATABASE_ID` are optional nonsecret overrides and otherwise use the checked-in public Firebase config. Never put service-account material in build output, Git, frontend variables, or logs.

## Media backend is a launch blocker

Product image bytes currently use the Manus storage service, while the Vercel app resolves Manus media keys through a server route. A Vercel deployment does not inherit Manus's gateway. The configured Firebase Storage bucket returned 404 during a read-only check, so Firebase Storage is not currently verified. Do not copy Manus credentials to Vercel or create a bucket without the owner's choice. Select an owner-approved durable production media backend, configure its protected credentials, and test upload plus public delivery on a Vercel Preview before production.

The app's `/api/health` checks the configured Firestore and Firebase Auth services. In Vercel it also fails readiness when the existing Manus media credentials are absent; therefore health will intentionally remain unavailable until the Vercel media backend is configured. Manus Preview readiness is not blocked by this Vercel-only media requirement.

## Deployment status

The Manus Preview runs on port 3000. TypeScript and 33 existing tests passed on 2026-11-17. A production Vercel project, production Firebase credentials, an approved Vercel media backend, and owner Firebase Auth credentials are not yet configured. No production deployment or live Firestore rules deployment has been performed. Do not describe the project as live until a production deployment and smoke tests succeed.

## Official sources

- [Express on Vercel](https://vercel.com/docs/frameworks/backend/express) — Express exports, single-function behavior, static assets, and `express.static()` limitation. Consulted 2026-10-22.
- [Vercel Functions limits](https://vercel.com/docs/functions/limitations) — request/response payload ceiling, memory/duration, regions, and function bundle limits. Consulted 2026-10-22.
- [Advanced Function configuration](https://vercel.com/docs/functions/configuring-functions/advanced-configuration) — `vercel.json` function configuration and bundling. Consulted 2026-10-22.
- [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json#functions) — `functions.includeFiles` configuration for files bundled with the Express Function. Consulted 2026-11-13.
- [Firebase ID token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens) — verify client-issued Firebase ID tokens on a custom backend instead of trusting a browser-supplied email. Consulted 2026-11-13.
- [Firebase Admin setup](https://firebase.google.com/docs/admin/setup) — initialize trusted server SDKs with service-account credentials kept private. Consulted 2026-11-14.
