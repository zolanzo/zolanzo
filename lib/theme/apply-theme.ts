import {
  THEME_BROWSER_COLOR_DARK,
  THEME_BROWSER_COLOR_LIGHT,
  type ResolvedTheme,
} from "@/lib/theme/constants";

function applyBrowserThemeColor(resolved: ResolvedTheme): void {
  const color =
    resolved === "dark" ? THEME_BROWSER_COLOR_DARK : THEME_BROWSER_COLOR_LIGHT;
  const metas = document.querySelectorAll('meta[name="theme-color"]');

  if (metas.length === 0) {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", color);
    document.head.appendChild(meta);
    return;
  }

  metas.forEach((meta) => {
    meta.removeAttribute("media");
    meta.setAttribute("content", color);
  });
}

export function applyResolvedTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  root.style.colorScheme = resolved;
  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-theme-preference", resolved);
  applyBrowserThemeColor(resolved);
}
