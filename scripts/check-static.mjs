import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const dist = resolve(process.cwd(), "dist");
const locales = ["en", "ar", "de", "ru", "hi"];
const kinds = ["", "privacy/", "terms/"];
const base = (process.env.VITE_BASE_PATH || "/").replace(/^([^/])/, "/$1").replace(/(?<!\/)$/, "/");
const origin = (process.env.SITE_URL || "").replace(/\/$/, "");
let pageCount = 0;

for (const locale of locales) {
  for (const kind of kinds) {
    const route = `${locale}/${kind}`;
    const file = resolve(dist, route, "index.html");
    await access(file);
    const html = await readFile(file, "utf8");
    assert.match(html, new RegExp(`<html lang="${locale}" dir="${locale === "ar" ? "rtl" : "ltr"}"`), `${route} has the wrong language or direction`);
    assert.match(html, /<div id="root">[\s\S]*?<\/div>/, `${route} has no server-rendered root`);
    assert.match(html, /<title>[^<]+<\/title>/, `${route} has no title`);
    assert.match(html, /<meta name="description" content="[^"]+"/, `${route} has no description`);
    assert.match(html, /<meta property="og:type" content="website"/, `${route} has no Open Graph type`);
    assert.match(html, /<meta property="og:site_name" content="Sebastian Houcem"/, `${route} has no Open Graph site name`);
    assert.match(html, /<meta property="og:title" content="[^"]+"/, `${route} has no Open Graph title`);
    assert.match(html, /<meta property="og:description" content="[^"]+"/, `${route} has no Open Graph description`);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image"/, `${route} has no Twitter card`);
    const ldJson = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(ldJson, `${route} has no structured data`);
    const schemaTypes = JSON.parse(ldJson[1]).map((entry) => entry["@type"]).sort();
    assert.deepEqual(schemaTypes, ["Person", "WebSite"], `${route} has unexpected structured-data types`);
    if (kind) assert.match(html, /<meta name="robots" content="noindex,follow"/, `${route} legal starter page must not be indexed`);
    if (origin) {
      assert.match(html, /hreflang=/, `${route} is missing localized alternate links`);
      const expectedCanonical = `${origin}${base}${route}`;
      assert.ok(html.includes(`<link rel="canonical" href="${expectedCanonical}"`), `${route} has no expected canonical URL`);
      assert.ok(html.includes(`<meta property="og:url" content="${expectedCanonical}"`), `${route} has no matching Open Graph URL`);
      assert.ok(html.includes(`<meta property="og:image" content="${origin}${base}social-preview.svg"`), `${route} has no absolute social image`);
    }
    if (base !== "/") {
      for (const [, assetPath] of html.matchAll(/(?:href|src)="(\/(?!\/)[^"]*)"/g)) {
        assert.ok(assetPath.startsWith(base), `${route} contains an asset or internal link outside base path: ${assetPath}`);
      }
    }
    assert.doesNotMatch(html, /__META_|undefined|NaN/, `${route} contains a build placeholder`);
    pageCount += 1;
  }
}

for (const file of ["index.html", "404.html", "robots.txt", "sitemap.xml", "manus-routes.json", "brand-mark.svg", "social-preview.svg"]) {
  await access(resolve(dist, file));
}
const routes = JSON.parse(await readFile(resolve(dist, "manus-routes.json"), "utf8"));
const expectedRoutes = ["/", ...locales.flatMap((locale) => kinds.map((kind) => `/${locale}/${kind}`))].sort();
assert.deepEqual(routes.routes.map((route) => route.path).sort(), expectedRoutes, "route manifest does not match generated pages");
const sitemap = await readFile(resolve(dist, "sitemap.xml"), "utf8");
assert.equal((sitemap.match(/<url>/g) || []).length, origin ? locales.length : 0, "sitemap must list only indexable language homepages");
console.log(`Static output checks passed for ${pageCount} localized HTML pages plus root, 404, metadata assets, sitemap, robots, and the route manifest (base: ${base}; origin: ${origin || "not configured"}).`);
