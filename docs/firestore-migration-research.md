# Firebase, Firestore, and Vercel implementation findings

## Findings that affect this project

The existing browser config selects a named Firestore database. Firebase's Admin Node reference labels its `getFirestore(app, databaseId)` overload as public preview and says not to use that overload in production. The current Google Cloud Firestore Node client types instead expose `Settings.databaseId`; use the Google Cloud Node server client with the project's explicit database ID rather than silently connecting to `(default)` or using the preview Admin overload. The value must be kept aligned with `firebase-applet-config.json`.

The server client is privileged: Google documents that server client requests are not evaluated against Firestore Security Rules and are authorized through IAM. The application must therefore verify Firebase ID tokens and active-admin permissions in server middleware before any administrator procedure runs. The service account should be kept outside source control and supplied only through protected secret storage.

Firebase's custom-backend guide directs the client to send its Firebase ID token over HTTPS and the backend to verify it with the Admin SDK. The Admin SDK's ordinary ID-token verification validates token signature, expiry, audience and issuer, but does not check revocation unless the server opts into the revocation check. The Admin Auth API can create users and update existing account properties, including passwords; this is appropriate for the private owner-provisioning operation, not a public endpoint.

Firestore transactions provide atomic read/write behavior. They will be used for slug reservations, numeric ID allocation, and other operations that need to prevent concurrent conflicts.

Vercel's current Node version guide lists 26.x as the new-project default and 24.x/22.x as supported; a version range in `package.json` overrides the project selection. This project pins Node `22.x` to match the tested Manus runtime and avoid silently moving to the default 26.x runtime. Vercel's Express guide says a root `index.ts` default export is deployed as one Function and static files are served from root `public/`, not by `express.static()`. The checked-in build stages CDN assets into `public/` and includes the HTML shell in the Express Function.

A read-only metadata request for the Firebase project's configured Storage bucket, using the protected Development credential, returned HTTP 404. Do not assume that bucket is available for production uploads. The current uploader uses Manus Storage; Vercel production therefore needs owner-approved Manus storage credentials or a separately enabled and verified Firebase Storage bucket before image upload/redirect features can be considered production-ready.

## Sources

- [1]: https://firebase.google.com/docs/admin/setup "Add the Firebase Admin SDK to your server"
- [2]: https://firebase.google.com/docs/auth/admin/verify-id-tokens "Verify Firebase Authentication ID tokens"
- [3]: https://firebase.google.com/docs/auth/admin/manage-users "Manage Firebase Authentication users"
- [4]: https://firebase.google.com/docs/reference/admin/node/firebase-admin.firestore "Firebase Admin Node.js Firestore reference"
- [5]: https://raw.githubusercontent.com/googleapis/nodejs-firestore/main/types/firestore.d.ts "Google Cloud Firestore Node.js client settings"
- [6]: https://docs.cloud.google.com/firestore/native/docs/reference/libraries "Firestore client libraries and server access model"
- [7]: https://firebase.google.com/docs/firestore/manage-databases "Create, manage, and access named Firestore databases"
- [8]: https://firebase.google.com/docs/firestore/use-rest-api "Firestore REST API authentication and endpoints"
- [9]: https://docs.cloud.google.com/firestore/native/docs/manage-data/transactions "Firestore transactions and batched writes"
- [10]: https://cloud.google.com/blog/products/databases/firestore-multiple-databases-is-now-generally-available "Firestore multiple-database general availability"
- [11]: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions "Supported Node.js versions on Vercel"
- [12]: https://vercel.com/docs/frameworks/backend/express "Express applications and static assets on Vercel"
- [13]: https://vercel.com/docs/project-configuration/vercel-json "Vercel static project configuration"
