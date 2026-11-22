# POLINA on Vercel: deployment and runtime notes

## Vercel framework and routing

The project is a Vite client plus an Express server. `vercel.json` pins the framework to `express`, which overrides a Vercel dashboard preset that might otherwise classify the project as Vite-only. Vercel's current Express guide accepts a default-exported application at the repository-root `index.ts` and runs it as one Function. This keeps `/api/*`, SEO documents, Firebase media redirects, and client-side routes inside the Express application rather than letting a Vite-only deployment return Vercel's generic 404.

The project build command is `pnpm build:vercel`. It builds the Vite output in `dist/public` and stages CDN assets into root `public/`. Vercel serves root `public/` files from its CDN; `express.static()` does not serve those CDN assets. The app's Express handler still serves its HTML shell for client-side routes and serves API/SEO responses. Do not set a separate Vercel output directory, restore a `functions` glob for the root `index.ts`, or add a catch-all rewrite to `/index.html`: these would conflict with the custom Express route handling and could bypass APIs or media responses.

`package.json` specifies Node.js 22.x and pins pnpm through `packageManager`. The Vercel dashboard's project root should remain the repository root (`./`); the checked-in `vercel.json` overrides the dashboard framework selection.

## Firebase Auth, Firestore, and Storage

The active server uses Firebase Authentication and the existing named Firestore database. It verifies Firebase ID tokens and requires an active `admins/{uid}` record for administrator operations. Vercel runtime requires `FIREBASE_SERVICE_ACCOUNT_JSON` as a protected environment variable. `FIREBASE_PROJECT_ID` and `FIRESTORE_DATABASE_ID` are optional, nonsecret overrides; otherwise they use the public project/database identifiers in `firebase-applet-config.json`. Never put service-account material in build output, Git, frontend variables, or logs.

On Vercel, uploaded product-image bytes are written to Firebase Storage with the same Firebase Admin service account. The bucket name is read from the optional nonsecret `FIREBASE_STORAGE_BUCKET` environment variable or defaults to the `storageBucket` value in `firebase-applet-config.json`. The app keeps stable `/manus-storage/<key>` application paths and redirects valid product-media requests to short-lived signed Firebase Storage URLs. The Vercel `/api/health` endpoint checks Firestore, Firebase Auth, and Firebase Storage bucket reachability; it returns unavailable until required credentials and the bucket are usable. The service account must have permission to inspect the bucket, create objects, and sign read URLs.

Manus Preview continues to use the Manus-managed storage adapter and existing `/manus-storage/` route. The Vercel Firebase Storage adapter is selected only when `VERCEL=1`; do not copy Manus API keys to Vercel for product-media storage. Existing objects in Manus storage are not copied automatically. If the Firestore catalog already references Manus-hosted images, migrate those bytes into Firebase Storage or re-upload them through the admin editor after Firebase Storage is enabled; otherwise those existing image URLs will not resolve on Vercel.

The bucket previously returned 404 during a read-only check. The owner must enable/create the configured Firebase Storage bucket and verify its service-account permissions before production readiness can pass. Firebase's [Admin Cloud Storage guide](https://firebase.google.com/docs/storage/admin/start) currently says the Firebase project must be on the Blaze pay-as-you-go plan to use the Admin Storage API; check the project's billing plan and review current charges before enabling Storage. No bucket has been created or changed by this project work. The checked-in `firestore.rules` deny direct browser access and have not been deployed; confirm no other clients rely on existing Firebase rules before changing them.

## Owner-side Vercel setup and launch checks

1. Import `rishabhcyberguy/polina-collection` from GitHub and use `main` with the repository root (`./`). Keep the build command governed by the committed `vercel.json` (`pnpm build:vercel`). Its `framework: "express"` setting is intentional even if the project-creation UI first suggests Vite.
2. Add `FIREBASE_SERVICE_ACCOUNT_JSON` directly in Vercel's encrypted environment-variable settings for Preview and Production (and Development only if needed). Do not paste it into chat, source files, public/bundled variables, or Git. Add `FIREBASE_STORAGE_BUCKET` only if using a bucket name different from the checked-in Firebase config.
3. Confirm the Firebase project is on the required Blaze plan, enable/create the configured Storage bucket, and confirm the Firebase service account has the permissions required for bucket metadata, object upload, and signed reads. Vercel's `/api/health` must return HTTP 200 after Firestore, Auth, and Storage can all be reached.
4. Add the final Vercel production domain to Firebase Authentication's authorized domains and test sign-in, password recovery, catalog reads, admin authorization, image upload, and public image delivery in a Vercel Preview deployment before production use.
5. Do not deploy Firestore rules from this repository until other clients' requirements have been checked. Do not treat a successful build alone as proof that the app or database is live.

No Vercel project creation, deployment, domain change, Firebase bucket creation, or Firestore-rules deployment has been performed as part of the repository preparation.

## Verified references

- [Express on Vercel](https://vercel.com/docs/frameworks/backend/express) — root Express entrypoints, single-Function behavior, and CDN static assets; consulted 2026-11-22.
- [Vercel `vercel.json` configuration](https://vercel.com/docs/project-configuration/vercel-json) — framework override, build command, and valid function glob patterns; consulted 2026-11-22.
- [Vercel service configuration reference](https://vercel.com/docs/services/config-reference) — confirms `express` as a valid framework slug; consulted 2026-11-22.
- [Vercel 404 troubleshooting](https://vercel.com/kb/guide/why-is-my-deployed-project-giving-404) — routing metadata and framework selection as causes of sitewide 404s after successful builds; consulted 2026-11-22.
- [Firebase Admin setup](https://firebase.google.com/docs/admin/setup) — trusted server credentials; consulted 2026-11-14.
- [Firebase ID token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens) — verify client-issued identity tokens on a custom backend; consulted 2026-11-13.
- [Firebase Admin Cloud Storage](https://firebase.google.com/docs/storage/admin/start) — authenticated default/custom buckets and the Admin Storage billing prerequisite; consulted 2026-11-22.
- [Cloud Storage V4 signed URL sample](https://docs.cloud.google.com/storage/docs/samples/storage-generate-signed-url-v4) — temporary GET URLs; consulted 2026-11-22.
