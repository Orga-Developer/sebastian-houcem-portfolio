import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

const root = process.cwd();
const dist = resolve(root, "dist");
const shellPath = resolve(dist, "index.html");
const shell = await readFile(shellPath, "utf8");
const vite = await createServer({
  configFile: resolve(root, "vite.config.ts"),
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

function normalizeBase(value = "/") {
  const raw = value.trim() || "/";
  const prefixed = raw.startsWith("/") ? raw : `/${raw}`;
  return prefixed.endsWith("/") ? prefixed : `${prefixed}/`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026");
}

function resolveOrigin(raw) {
  if (!raw?.trim()) return "";
  const parsed = new URL(raw.trim());
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("SITE_URL must be the real public HTTPS origin only, with no repository path, query, or credentials.");
  }
  return parsed.origin;
}

function withBase(base, route) {
  return `${base}${route.replace(/^\/+/, "")}`;
}

function replaceMeta(html, selector, tag) {
  const pattern = new RegExp(`<meta\\s+${selector}[^>]*>`, "i");
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

try {
  const [{ default: App }, { copy, locales }, { siteSettings, owner }] = await Promise.all([
    vite.ssrLoadModule("/src/App.tsx"),
    vite.ssrLoadModule("/src/content/copy.ts"),
    vite.ssrLoadModule("/src/content/site.ts"),
  ]);

  const base = normalizeBase(process.env.VITE_BASE_PATH);
  const origin = resolveOrigin(process.env.SITE_URL || process.env.VITE_SITE_URL || siteSettings.publicSiteUrl || "");
  const pageVariants = [
    { kind: "home", path: "" },
    { kind: "privacy", path: "privacy/" },
    { kind: "terms", path: "terms/" },
  ];
  const publicPages = [];
  const localeLabels = { en: "en_US", ar: "ar_AR", de: "de_DE", ru: "ru_RU", hi: "hi_IN" };

  async function writeLocalizedPage(locale, page) {
    const text = copy[locale];
    const canonicalRoute = `${locale}/${page.path}`;
    const pageTitle = page.kind === "home" ? text.meta.title : `${text.nav[page.kind]} — ${owner.name}`;
    const pageDescription = page.kind === "home" ? text.meta.description : text.legalStarterNotice;
    let html = shell.replace(/<html\b[^>]*>/i, `<html lang="${locale}" dir="${text.dir}" data-theme="light">`);
    const markup = renderToString(createElement(App, { locale, page: page.kind }));
    html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">${markup}</div>`);
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);
    html = replaceMeta(html, 'name="description"', `<meta name="description" content="${escapeHtml(pageDescription)}" />`);
    html = replaceMeta(html, 'property="og:title"', `<meta property="og:title" content="${escapeHtml(pageTitle)}" />`);
    html = replaceMeta(html, 'property="og:description"', `<meta property="og:description" content="${escapeHtml(pageDescription)}" />`);
    html = replaceMeta(html, 'property="og:locale"', `<meta property="og:locale" content="${localeLabels[locale]}" />`);
    html = replaceMeta(html, 'name="twitter:title"', `<meta name="twitter:title" content="${escapeHtml(pageTitle)}" />`);
    html = replaceMeta(html, 'name="twitter:description"', `<meta name="twitter:description" content="${escapeHtml(pageDescription)}" />`);
    if (page.kind !== "home") {
      html = replaceMeta(html, 'name="robots"', '<meta name="robots" content="noindex,follow" />');
    }

    const languageAlternates = locales.map((alternate) => {
      const alternateRoute = `${alternate}/${page.path}`;
      return origin ? `<link rel="alternate" hreflang="${alternate}" href="${escapeHtml(origin + withBase(base, alternateRoute))}" />` : "";
    }).filter(Boolean).join("\n    ");
    const xDefault = origin ? `<link rel="alternate" hreflang="x-default" href="${escapeHtml(origin + withBase(base, `en/${page.path}`))}" />` : "";
    const pageUrl = origin ? origin + withBase(base, canonicalRoute) : "";
    const socialImage = origin ? origin + withBase(base, "social-preview.svg") : "";
    const absoluteMetadata = origin ? `\n    <link rel="canonical" href="${escapeHtml(pageUrl)}" />\n    ${languageAlternates}\n    ${xDefault}\n    <meta property="og:url" content="${escapeHtml(pageUrl)}" />\n    <meta property="og:image" content="${escapeHtml(socialImage)}" />\n    <meta property="og:image:type" content="image/svg+xml" />\n    <meta name="twitter:image" content="${escapeHtml(socialImage)}" />` : "";
    const structuredData = [
      { "@context": "https://schema.org", "@type": "Person", name: owner.name, jobTitle: owner.role },
      { "@context": "https://schema.org", "@type": "WebSite", name: siteSettings.siteName, inLanguage: locale, ...(pageUrl ? { url: pageUrl } : {}) },
    ];
    const jsonLd = `<script type="application/ld+json">${escapeJsonForHtml(structuredData)}</script>`;
    html = html.replace("</head>", `${absoluteMetadata}\n    ${jsonLd}\n  </head>`);

    const relativeFile = page.path ? `${locale}/${page.path}index.html` : `${locale}/index.html`;
    const filePath = resolve(dist, relativeFile);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, html, "utf8");
    publicPages.push({ path: `/${canonicalRoute}`, url: pageUrl, locale, kind: page.kind });
  }

  for (const locale of locales) {
    for (const page of pageVariants) await writeLocalizedPage(locale, page);
  }

  const sitemapEntries = publicPages.filter((page) => page.url && page.kind === "home").map((page) => `  <url><loc>${escapeHtml(page.url)}</loc></url>`).join("\n");
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapEntries ? `\n${sitemapEntries}\n` : ""}</urlset>\n`;
  await writeFile(resolve(dist, "sitemap.xml"), sitemap, "utf8");
  const robots = `User-agent: *\nAllow: /\n${origin ? `Sitemap: ${origin}${withBase(base, "sitemap.xml")}\n` : ""}`;
  await writeFile(resolve(dist, "robots.txt"), robots, "utf8");

  const notFoundHtml = `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Page not found — Sebastian Houcem</title><link rel="icon" type="image/svg+xml" href="${withBase(base, "brand-mark.svg")}"><style>:root{font-family:system-ui,sans-serif;color:#171717;background:#faf9f6}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:1rem}.card{max-width:36rem;padding:2.5rem;border:1px solid #dedbd3;border-radius:1.5rem;background:#fffefa}a{color:#775b34;text-underline-offset:.2em}p{line-height:1.7;color:#6f6b63}</style></head><body><main class="card"><img src="${withBase(base, "brand-mark.svg")}" width="44" height="44" alt=""><p>404 · Sebastian Houcem</p><h1>Page not found</h1><p>This address does not match a published page. Choose a language to return to the portfolio.</p><p><a href="${withBase(base, "en/")}">English</a> · <a href="${withBase(base, "ar/")}" lang="ar" dir="rtl">العربية</a> · <a href="${withBase(base, "de/")}">Deutsch</a> · <a href="${withBase(base, "ru/")}">Русский</a> · <a href="${withBase(base, "hi/")}" lang="hi">हिन्दी</a></p></main></body></html>`;
  await writeFile(resolve(dist, "404.html"), notFoundHtml, "utf8");

  const routeManifest = {
    routes: [
      { path: "/", title: owner.name },
      ...publicPages.map((page) => ({ path: page.path, title: page.kind === "home" ? copy[page.locale].meta.title : `${copy[page.locale].nav[page.kind]} — ${owner.name}` })),
    ],
  };
  await writeFile(resolve(dist, "manus-routes.json"), `${JSON.stringify(routeManifest)}\n`, "utf8");
  console.log(`Generated ${publicPages.length} localized static pages, a 404 fallback, sitemap.xml, robots.txt, and manus-routes.json (base: ${base}; public origin: ${origin || "not configured"}).`);
} finally {
  await vite.close();
}
