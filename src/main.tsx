import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/dm-sans";
import "@fontsource/noto-sans-arabic/400.css";
import "@fontsource/noto-sans-arabic/600.css";
import "@fontsource/noto-sans-devanagari/400.css";
import "@fontsource/noto-sans-devanagari/600.css";
import "./styles.css";

import { createElement } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App, { resolveLocale, resolvePageKind } from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("The application root element is missing.");

const locale = resolveLocale(window.location.pathname);
const page = resolvePageKind(window.location.pathname);
const app = createElement(App, { locale, page });

if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
