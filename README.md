# Polina Collection

Polina is a luxury, expressive nightwear and contemporary clothing brand application featuring editorial design, immersive collections, interactive product showcases, high-end lookbooks, and smooth user experiences.

## Features

- **Editorial Brand Collections**: Explore curated seasonal drops and luxury nightwear lines.
- **Interactive Product Showcase**: Detailed product views, size selectors, fabric details, and high-resolution imagery.
- **Admin Dashboard**: Manage products, images, retailer links, and page content.
- **Responsive & Motion-Driven UI**: Built with React, Tailwind CSS, and Framer Motion.
- **Firebase Auth and Firestore**: Firebase Authentication protects the admin portal; the server stores catalog and page data in the configured named Firestore database.
- **Firebase Storage on Vercel**: Production product uploads use the configured Firebase Storage bucket; Manus Preview retains its managed media path.

## Development

- Install dependencies with `pnpm install`.
- Run `pnpm dev` to start the Manus Preview-compatible Vite/Express server on port 3000.
- Run `pnpm lint`, `pnpm test`, and `pnpm build` before release.
- Run `pnpm build:vercel` for the Vercel Express Function build. CDN assets are staged into root `public/` only in a Vercel deployment; local runs preserve the source assets.

The server requires a protected `FIREBASE_SERVICE_ACCOUNT_JSON` value. Project and named-database IDs default to the checked-in public Firebase config. Never place server credentials in client code, Vite variables, logs, or Git. See [administrator operations](docs/admin-operations.md) and [Vercel runtime notes](docs/vercel-runtime.md).

## Deployment status

The Vercel deployment configuration and Firebase Storage adapter are checked in, but production is not live. The owner must import the GitHub repository into Vercel, set the protected Firebase service-account variable, verify the Firebase project's required Blaze plan, enable/create the configured Firebase Storage bucket, confirm its IAM permissions, and run the health/auth/upload smoke tests. Existing Manus-hosted product images are not automatically copied; migrate or re-upload them to Firebase Storage if the Firestore catalog already references them. The app does not seed demo catalog data; add genuine content through the protected admin portal after the owner account is provisioned. See [Vercel runtime notes](docs/vercel-runtime.md).
