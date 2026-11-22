# POLINA operator notes

## Administrator access

POLINA uses Firebase Authentication for Google and email/password sign-in. The server verifies Firebase ID tokens and requires a matching active document at `admins/{uid}` in the configured named Firestore database. The record must have `role: "admin"`, `active: true`, and the same verified email as the Firebase user. Public registration is disabled. No default administrator or source-level password exists.

The server requires `FIREBASE_SERVICE_ACCOUNT_JSON`, supplied only through protected environment settings, and uses the project/database IDs in `firebase-applet-config.json` unless nonsecret overrides are explicitly configured. Never put the service-account JSON, owner password, or filled `.env` in chat, source files, frontend variables, logs, screenshots, or Git.

To provision or reset the owner account, use the protected secret-input flow for `POLINA_ADMIN_EMAIL` and `POLINA_ADMIN_PASSWORD`, then run `pnpm admin:provision -- --confirm-owner` only after the owner has reviewed the exact email and explicitly approved the operation. The script updates only that Firebase Auth user and matching `admins/{uid}` document; it does not deactivate unrelated administrators. Passwords are not logged or echoed. New accounts require email verification before admin access. Do not run against a Firebase project until its identity and scope are confirmed.

## Firestore data and client rules

The active server data adapter stores categories, products, nested product images, `site_pages`, published `site_content`, administrators, counters, slug reservations, and content-edit history in Firestore. The app deliberately does not seed demo records or fall back to in-memory sample data. If collections are empty, the storefront remains empty until real content is added by an administrator.

The checked-in `firestore.rules` deny direct browser reads and writes because public and admin application operations go through the server. The server verifies identity/role before admin mutations; trusted Admin SDK operations are authorized separately through Google Cloud IAM. The rule file has not been deployed to Firebase. Before deploying it, confirm that no other website, mobile app, or operator tool relies on the current client rules.

## Password recovery

Password-reset email is sent by Firebase Auth. The UI uses a neutral confirmation that does not reveal whether an account exists. Configure the production domain in Firebase Authentication's authorized domains, and verify the Firebase email-action settings and delivery before launch. Never expose reset codes or action links in logs.

## Product images and deployment

Image metadata is stored in Firestore. Manus Preview continues to use Manus-managed image storage; Vercel uses Firebase Storage with the existing Firebase Admin service account. The bucket defaults to `storageBucket` in `firebase-applet-config.json`; `FIREBASE_STORAGE_BUCKET` is an optional nonsecret override. Do not transfer Manus storage credentials to Vercel. The Firebase bucket previously returned 404 during a read-only check, so the owner must enable/create it and confirm the service account can inspect the bucket, upload objects, and sign read URLs before Vercel health will pass. Firebase's [Admin Cloud Storage guide](https://firebase.google.com/docs/storage/admin/start) says the project must be on the Blaze pay-as-you-go plan to use the Admin Storage API; check billing before enabling the bucket.

Existing Manus-hosted objects are not copied into Firebase automatically. If the catalog already points to them, migrate or re-upload those image files after the Firebase Storage bucket is ready; otherwise the old media paths will not resolve on Vercel. Before launch, set `FIREBASE_SERVICE_ACCOUNT_JSON` through Vercel's protected environment controls. Validate `/api/health`, public catalog reads, admin auth, image upload, and public media delivery on a Vercel Preview deployment before production. Add the production domain to Firebase Authentication's authorized domains. Back up Firestore and stored media on an appropriate schedule and test a restore. Never store credentials or uploaded media in Git.
