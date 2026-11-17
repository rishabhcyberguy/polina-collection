# Polina Collection

Polina is a luxury, expressive nightwear and contemporary clothing brand application featuring editorial design, immersive collections, interactive product showcases, high-end lookbooks, and smooth user experiences.

## Features

- **Editorial Brand Collections**: Explore curated seasonal drops and luxury nightwear lines.
- **Interactive Product Showcase**: Detailed product views, size selectors, fabric details, and high-resolution imagery.
- **Admin Dashboard**: Manage products, images, retailer links, and page content.
- **Responsive & Motion-Driven UI**: Built with React, Tailwind CSS, and Framer Motion.
- **Firebase Auth and Firestore**: Firebase Authentication protects the admin portal; the server stores catalog and page data in the configured named Firestore database.

## Development

- Install dependencies with `pnpm install`.
- Run `pnpm dev` to start the Manus Preview-compatible Vite/Express server on port 3000.
- Run `pnpm lint`, `pnpm test`, and `pnpm build` before release.
- Run `pnpm build:vercel` for the Vercel Express Function build. CDN assets are staged into root `public/` only in a Vercel deployment; local runs preserve the source assets.

The server requires a protected `FIREBASE_SERVICE_ACCOUNT_JSON` value. Project and named-database IDs default to the checked-in public Firebase config. Never place server credentials in client code, Vite variables, logs, or Git. See [administrator operations](docs/admin-operations.md) and [Vercel runtime notes](docs/vercel-runtime.md).

## Deployment status

The Manus Preview has been configured. Production Vercel deployment is not complete: the Vercel project/runtime secrets and an owner-approved durable image-storage backend must be configured and validated first. The app does not seed demo catalog data; add genuine content through the protected admin portal after the owner account is provisioned.
