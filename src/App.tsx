import { useState } from "react";
import { copy, locales } from "./content/copy";
import { marketplaces, owner, products, siteSettings, socialLinks } from "./content/site";
import type { Locale, PageKind, ProductEntry } from "./content/types";

const basePath = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
const categoryIndexes: Record<ProductEntry["category"], number> = {
  "graphic-design": 0,
  "templates-ui": 1,
  "print-on-demand": 2,
  publications: 3,
  "creative-resources": 4,
};

function localPath(locale: Locale, page: PageKind = "home"): string {
  const tail = page === "home" ? "" : `${page}/`;
  return `${basePath}${locale}/${tail}`;
}

function validHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function imageUrl(value: string): string | undefined {
  if (validHttpsUrl(value)) return value;
  if (value.startsWith("/") && !value.startsWith("//") && !value.split("/").includes("..")) return `${basePath}${value.slice(1)}`;
  return undefined;
}

function visibleProduct(product: ProductEntry): boolean {
  return product.verified && product.name.trim().length > 0 && product.description.trim().length > 0 && validHttpsUrl(product.purchaseUrl);
}

interface AppProps {
  locale: Locale;
  page?: PageKind;
}

export default function App({ locale, page = "home" }: AppProps) {
  const text = copy[locale];
  const [menuOpen, setMenuOpen] = useState(false);
  const liveProducts = products.filter(visibleProduct);
  const liveMarketplaces = marketplaces.filter((entry) => entry.verified && entry.name.trim() && validHttpsUrl(entry.url));
  const liveSocialLinks = socialLinks.filter((entry) => entry.verified && entry.name.trim() && validHttpsUrl(entry.url));
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner.email);

  function changeLocale(nextLocale: Locale) {
    try {
      window.localStorage.setItem("sebastian-locale", nextLocale);
    } catch {
      // The locale URL remains the source of truth when storage is unavailable.
    }
    window.location.assign(localPath(nextLocale, page));
  }

  function toggleTheme() {
    const root = document.documentElement;
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = nextTheme;
    try {
      window.localStorage.setItem("sebastian-theme", nextTheme);
    } catch {
      // The current page remains usable if storage is unavailable.
    }
  }

  const primaryLinks = [
    { id: "about", label: text.nav.about },
    { id: "products", label: text.nav.products },
    { id: "contact", label: text.nav.contact },
  ];

  return (
    <div className={`site-shell locale-${locale}`}>
      <a className="skip-link" href="#main-content">{text.controls.skipToContent}</a>
      <header className="site-header">
        <a className="brand" href={localPath(locale)} aria-label={`${owner.name} — ${text.nav.home}`}>
          <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" rx="18" fill="currentColor" />
            <path d="M18 21.5c0-4.3 3.9-7.3 9.7-7.3 4.5 0 8.2 1.8 10.4 5.1l-4.4 3.1c-1.4-2-3.3-3-5.9-3-2.5 0-4.1.9-4.1 2.3 0 4.8 16.1 1.7 16.1 12.7 0 5.4-4.8 9-12 9-6.2 0-10.4-2.4-12.9-6.4l4.7-3.1c2 2.9 4.7 4.4 8.2 4.4 3.2 0 5.1-1.1 5.1-2.9 0-5.2-14.9-2.2-14.9-11.9Z" fill="#FAF9F6" />
            <path d="M44 17h5v30h-5V34h-8v-5h8V17Z" fill="#C5A46D" />
            <circle cx="48.5" cy="12.5" r="2.5" fill="#C5A46D" />
          </svg>
          <span className="brand-name">{owner.name}</span>
        </a>

        <nav className="desktop-nav" aria-label={text.nav.home}>
          {page === "home" ? primaryLinks.map((link) => <a key={link.id} href={`#${link.id}`}>{link.label}</a>) : <a href={localPath(locale)}>{text.nav.home}</a>}
          {liveMarketplaces.length > 0 && page === "home" && <a href="#marketplaces">{text.marketplaces.title}</a>}
        </nav>

        <div className="header-controls">
          <label className="sr-only" htmlFor="language-select">{text.controls.language}</label>
          <select id="language-select" className="language-select" value={locale} onChange={(event) => changeLocale(event.target.value as Locale)}>
            {locales.map((code) => <option value={code} key={code}>{copy[code].localeName}</option>)}
          </select>
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`${text.controls.lightMode} / ${text.controls.darkMode}`} title={`${text.controls.lightMode} / ${text.controls.darkMode}`}>
            <span aria-hidden="true">◐</span>
          </button>
          {page === "home" && <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? text.controls.closeMenu : text.controls.openMenu} onClick={() => setMenuOpen((open) => !open)}><span aria-hidden="true">{menuOpen ? "×" : "≡"}</span></button>}
        </div>
      </header>

      {page === "home" && (
        <nav id="mobile-navigation" className="mobile-nav" aria-label={text.nav.home} hidden={!menuOpen}>
          {primaryLinks.map((link) => <a key={link.id} href={`#${link.id}`} onClick={() => setMenuOpen(false)}>{link.label}</a>)}
          {liveMarketplaces.length > 0 && <a href="#marketplaces" onClick={() => setMenuOpen(false)}>{text.marketplaces.title}</a>}
        </nav>
      )}

      {page === "home" ? (
        <main id="main-content">
          <section className="hero section-wrap" id="top" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" />{text.hero.eyebrow}</p>
              <h1 id="hero-title">{text.hero.title}</h1>
              <p className="hero-subtitle">{text.hero.subtitle}</p>
              <p className="hero-intro">{text.hero.intro}</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#products">{text.hero.primaryCta}<span aria-hidden="true">↗</span></a>
                <a className="button button-quiet" href="#contact">{text.hero.secondaryCta}<span aria-hidden="true">→</span></a>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="art-frame">
                <svg viewBox="0 0 520 520" role="presentation">
                  <circle className="art-ring art-ring-outer" cx="260" cy="260" r="214" />
                  <circle className="art-ring art-ring-inner" cx="260" cy="260" r="157" />
                  <path className="art-arc" d="M260 46a214 214 0 0 1 214 214" />
                  <path className="art-cross" d="M92 351h336M260 92v336" />
                  <circle className="art-core" cx="260" cy="260" r="84" />
                  <circle className="art-gold-dot" cx="419" cy="162" r="10" />
                  <circle className="art-small-dot" cx="150" cy="125" r="4" />
                  <path className="art-diamond" d="m260 207 53 53-53 53-53-53 53-53Z" />
                </svg>
                <span className="art-caption">S<span aria-hidden="true">·</span>H</span>
              </div>
              <span className="art-index">01 / 05</span>
            </div>
          </section>

          <div className="marquee-rule" aria-hidden="true"><span>{owner.name}</span><span>{text.hero.subtitle}</span><span>{text.hero.eyebrow}</span></div>

          <section className="content-section section-wrap about-section" id="about" aria-labelledby="about-title">
            <div className="section-label"><span>01</span><p className="eyebrow">{text.about.eyebrow}</p></div>
            <div className="section-body about-body">
              <h2 id="about-title">{text.about.title}</h2>
              <p className="body-copy">{text.about.body}</p>
              <div className="about-rule" aria-hidden="true"><span /></div>
            </div>
          </section>

          <section className="content-section section-wrap products-section" id="products" aria-labelledby="products-title">
            <div className="section-label"><span>02</span><p className="eyebrow">{text.products.eyebrow}</p></div>
            <div className="section-body">
              <div className="section-heading-row">
                <div><h2 id="products-title">{text.products.title}</h2><p className="section-intro">{text.products.intro}</p></div>
                <span className="section-index" aria-hidden="true">{String(liveProducts.length).padStart(2, "0")}</span>
              </div>
              {liveProducts.length > 0 ? (
                <div className="product-grid">
                  {liveProducts.map((product) => {
                    const localized = product.localized?.[locale];
                    const productName = localized?.name?.trim() || product.name;
                    const productDescription = localized?.description?.trim() || product.description;
                    const productImage = product.imagePath ? imageUrl(product.imagePath) : undefined;
                    return <article className="product-card" key={product.id}>
                      {productImage && <img className="product-image" src={productImage} alt={localized?.imageAlt || product.imageAlt || productName} loading="lazy" />}
                      <p className="product-category">{text.products.categories[categoryIndexes[product.category]]}</p>
                      <h3>{productName}</h3><p>{productDescription}</p>
                      <div className="product-card-bottom"><span>{product.price ? `${product.price}${product.currency ? ` ${product.currency}` : ""}` : ""}</span><a href={product.purchaseUrl} target="_blank" rel="noopener noreferrer">{text.products.viewProduct}<span aria-hidden="true">↗</span></a></div>
                    </article>;
                  })}
                </div>
              ) : (
                <div className="empty-products">
                  <div className="empty-mark" aria-hidden="true"><span /><span /><span /></div>
                  <div><h3>{text.products.emptyTitle}</h3><p>{text.products.emptyBody}</p></div>
                </div>
              )}
              <ul className="category-list" aria-label={text.products.title}>
                {text.products.categories.map((category, index) => <li key={category}><span className="category-number">0{index + 1}</span>{category}</li>)}
              </ul>
            </div>
          </section>

          {liveMarketplaces.length > 0 && <section className="content-section section-wrap market-section" id="marketplaces" aria-labelledby="marketplaces-title">
            <div className="section-label"><span>03</span><p className="eyebrow">{text.marketplaces.title}</p></div>
            <div className="section-body"><h2 id="marketplaces-title">{text.marketplaces.title}</h2><ul className="market-list">{liveMarketplaces.map((entry) => <li key={entry.name}><a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.name}<span aria-hidden="true">↗</span></a></li>)}</ul></div>
          </section>}

          <section className="contact-section" id="contact" aria-labelledby="contact-title">
            <div className="section-wrap contact-inner">
              <div className="section-label"><span>{liveMarketplaces.length > 0 ? "04" : "03"}</span><p className="eyebrow">{text.contact.eyebrow}</p></div>
              <div className="contact-main"><h2 id="contact-title">{text.contact.title}</h2><p>{text.contact.body}</p>
                {validEmail ? <a className="button button-primary" href={`mailto:${owner.email}`}>{text.contact.emailCta}<span aria-hidden="true">↗</span></a> : <p className="contact-missing">{text.contact.missingEmail}</p>}
              </div>
              <div className="contact-decoration" aria-hidden="true">SH<span>.</span></div>
            </div>
          </section>
        </main>
      ) : (
        <main id="main-content" className="legal-main section-wrap">
          <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" />{owner.name}</p>
          <h1>{page === "privacy" ? text.nav.privacy : text.nav.terms}</h1>
          <p className="legal-notice">{text.legalStarterNotice}</p>
          <a className="button button-quiet legal-back" href={localPath(locale)}><span aria-hidden="true">←</span>{text.nav.home}</a>
        </main>
      )}

      <footer className="site-footer section-wrap">
        <div className="footer-brand"><a className="brand" href={localPath(locale)}><span className="brand-mark-small" aria-hidden="true">SH</span><span className="brand-name">{owner.name}</span></a><p>{text.footer.tagline}</p></div>
        <nav className="footer-links" aria-label={text.nav.home}>
          {page === "home" ? <>{primaryLinks.map((link) => <a key={link.id} href={`#${link.id}`}>{link.label}</a>)}</> : <a href={localPath(locale)}>{text.nav.home}</a>}
          <a href={localPath(locale, "privacy")}>{text.nav.privacy}</a><a href={localPath(locale, "terms")}>{text.nav.terms}</a>
        </nav>
        {liveSocialLinks.length > 0 && <div className="social-links" aria-label={text.nav.contact}>{liveSocialLinks.map((entry) => <a key={entry.name} href={entry.url} target="_blank" rel="noopener noreferrer">{entry.name}<span aria-hidden="true">↗</span></a>)}</div>}
        <p className="copyright">© {__BUILD_YEAR__} {owner.name}. {text.footer.copyright}</p>
      </footer>
    </div>
  );
}

export function resolveLocale(pathname: string): Locale {
  const relativePath = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname.replace(/^\/+/, "");
  const firstSegment = relativePath.split("/").filter(Boolean)[0];
  if (firstSegment && locales.includes(firstSegment as Locale)) return firstSegment as Locale;
  const htmlLocale = document.documentElement.lang;
  return locales.includes(htmlLocale as Locale) ? htmlLocale as Locale : siteSettings.defaultLocale as Locale;
}

export function resolvePageKind(pathname: string): PageKind {
  if (/\/(privacy)(?:\/|\.html)?$/.test(pathname)) return "privacy";
  if (/\/(terms)(?:\/|\.html)?$/.test(pathname)) return "terms";
  return "home";
}
