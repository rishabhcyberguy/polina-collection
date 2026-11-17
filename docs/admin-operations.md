# POLINA operator notes

## Administrator access

POLINA uses Firebase Authentication for Google and email/password sign-in. The server verifies Firebase ID tokens and requires a matching active document at `admins/{uid}` in the configured named Firestore database. The record must have `role: "admin"`, `active: true`, and the same verified email as the Firebase user. Public registration is disabled. No default administrator or source-level password exists.

The server requires `FIREBASE_SERVICE_ACCOUNT_JSON`, supplied only through protected environment settings, and uses the project/database IDs in `firebase-applet-config.json` unless nonsecret overrides are explicitly configured. Never put the service-account JSON, owner password, or filled `.env` in chat, source, frontend variables, logs, screenshots, or Git.

To provision or reset the owner account, use the protected secret-input flow for `POLINA_ADMIN_EMAIL` and `POLINA_ADMIN_PASSWORD`, then run `pnpm admin:provision -- --confirm-owner` only after the owner has reviewed the exact email and explicitly approved the operation. The script updates only that Firebase Auth user and matching `admins/{uid}` document; it does not deactivate unrelated administrators. Passwords are not logged or echoed. New accounts require email verification before admin access. Do not run against a Firebase project until its identity and scope are confirmed.

## Firestore data and client rules

The active server data adapter stores categories, products, nested product images, `site_pages`, published `site_content`, administrators, counters, slug reservations, and content-edit history in Firestore. The app deliberately does not seed demo records or fall back to in-memory sample data. If collections are empty, the storefront remains empty until real content is added by an administrator.

The checked-in `firestore.rules` deny direct browser reads and writes because public and admin application operations go through the server. The server verifies identity/role before admin mutations; trusted Admin SDK operations are authorized separately through Google Cloud IAM. The rule file has not been deployed to Firebase. Before deploying it, confirm that no other website, mobile app, or operator tool relies on the current client rules.

## Password recovery

Password-reset email is sent by Firebase Auth. The UI uses a neutral confirmation that does not reveal whether an account exists. Configure the production domain in Firebase Authentication's authorized domains, and verify the Firebase email-action settings and delivery before launch. Never expose reset codes or action links in logs.

## Product images and deployment

Image metadata is stored in Firestore. The current image byte-storage path is Manus-managed storage, which requires `MANUS_API_URL` and `MANUS_API_KEY`; Vercel does not inherit Manus's media gateway. Do not transfer Manus credentials to Vercel. Select and configure an owner-approved production storage backend before enabling Vercel uploads or media redirects. A read-only check of the Firebase project's configured Storage bucket returned 404, so Firebase Storage is not currently a verified replacement.

Before launch, configure Firebase service-account credentials and the approved media backend through Vercel's protected environment controls. Validate health, public catalog reads, admin auth, upload, and published media delivery on a Vercel Preview deployment before production. Back up Firestore and stored media on an appropriate schedule and test a restore. Never store credentials or uploaded media in Git.
