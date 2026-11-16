# Sebastian Houcem — Personal Digital Creator

A static, multilingual portfolio for GitHub Pages. The published site is generated as HTML, CSS, JavaScript, and static assets; it does not need a Node.js server, database, API, or paid runtime.

## Local development

Requires Node.js 22.12 or newer in the 22.x line and npm 10.9.9. Install dependencies with `npm ci`, start the Vite development server with `npm run dev`, and open the local URL printed by Vite. Use `npm run typecheck` for TypeScript diagnostics.

## Build and preview

Run `npm run build` to create the static site in `dist/`. This builds the client bundle and writes pre-rendered locale/legal pages, localized metadata, a route manifest, a graceful `404.html`, `sitemap.xml`, and `robots.txt`. Set `VITE_BASE_PATH` to `/` for a user/organization site or to `/<repository-name>/` for a project site when building locally. Set `SITE_URL` to the actual public origin to generate canonical/alternate URLs and absolute sitemap entries. If no origin is configured, the build omits absolute canonical and social URLs and emits an empty sitemap; do not publish until the real `SITE_URL` is set. After building, run `npm run check:static` to verify all 15 localized HTML routes and generated metadata. Preview the built files with `npm run preview`.

## Owner configuration

Edit `src/content/site.ts` to add the public contact email, genuine products, marketplace profiles, social URLs, or public site origin. The starter data deliberately contains no products, marketplace accounts, social accounts, email address, prices, or purchase links. For each product, provide an accurate name and description, category, real HTTPS purchase URL, and `verified: true` only after checking the destination. Optionally add `localized` names, descriptions, and image alt text for `en`, `ar`, `de`, `ru`, and `hi`; the base name and description are used when a translation is not supplied. Add a marketplace or social profile only after confirming it belongs to Sebastian and its URL works; keep unconfigured entries out of the visitor-facing site. Product images are optional and should be real, authorized product assets with descriptive alt text. The language copy lives in `src/content/copy.ts` and can be edited there. Privacy and Terms pages are clearly labelled owner-editable starter pages; replace and review their content before relying on them.

## GitHub Pages deployment

1. Create or select a GitHub repository and push this project to its default branch, `main`.
2. In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Under **Settings → Secrets and variables → Actions → Variables**, add `SITE_URL` with the real public origin only, for example `https://username.github.io` or the verified custom-domain origin. Do not include the repository path; the workflow adds the correct path to page metadata and the sitemap.
4. Optionally add `SITE_BASE_PATH` if the automatic path is not appropriate. It must begin and end with `/`. Otherwise, the workflow uses `/` for a `username.github.io` repository and `/<repository-name>/` for a project site.
5. Push to `main` or run **Actions → Build and deploy Sebastian's portfolio to GitHub Pages → Run workflow**. GitHub Pages is public when deployed. The workflow builds `dist/`, uploads a Pages artifact, and deploys it with the required Pages and OIDC permissions.

The repository includes `.github/workflows/deploy.yml` but is not connected to or published from a GitHub account by this project build. Configure the verified GitHub repository, site origin, and Pages source before deployment.
