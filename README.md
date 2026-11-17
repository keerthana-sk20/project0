# Northstar Journal

A responsive technology publication built with React, Vite, Express, and MongoDB. The public site includes a homepage, searchable and category-filtered archive, Markdown article pages, related and previous/next navigation, sharing, and a protected editorial dashboard.

## Run the site

```sh
npm install
npm run dev
```

The public pages include sample articles and work without a database. When the API is available, published MongoDB articles replace the sample content.

## Run the full stack

1. Install and start MongoDB locally, or create a MongoDB Atlas database.
2. Copy `.env.example` to `.env` and set `MONGODB_URI`, a long random `JWT_SECRET`, `ADMIN_EMAIL`, and a strong `ADMIN_PASSWORD`.
3. Run `npm run dev:full`.
4. Open `http://localhost:5173`. The API runs on port `5000`; Vite proxies `/api`, uploads, `robots.txt`, and `sitemap.xml`.

The initial admin account is created on the first API startup when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set. Open `/admin` to sign in. The account is not recreated or its password changed on subsequent starts.

For production, run `npm run build`, set `SITE_URL` to the canonical public origin, then run `npm start`. The Express server serves the built client and generates the sitemap and robots file. Configure `VITE_GA_ID` and `VITE_GOOGLE_SITE_VERIFICATION` before building to enable Google Analytics 4 and Search Console verification.

## Editorial features

- Draft, publish, and schedule posts; scheduled content is published by the API on its next one-minute scheduler check.
- Markdown content supports headings, paragraphs, links, images, tables, and fenced code blocks.
- Post metadata includes SEO title/description, slug, featured image, category, author, tags, and featured status.
- Editors can upload JPG, PNG, WebP, or GIF images up to 5 MB.
- The dashboard supports category, tag, and author management.

## Checks

```sh
npm run lint
npm run build
```
