"use client";
import { useEffect, useState } from "react";
type Theme = "light" | "dark" | "system";
const themes: Theme[] = ["light", "dark", "system"];
function apply(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    const saved = localStorage.getItem("formatbase.theme");
    const initial = themes.includes(saved as Theme) ? saved as Theme : "system";
    // Browser preference is available only after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initial); apply(initial);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => { if ((localStorage.getItem("formatbase.theme") || "system") === "system") apply("system"); };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const cycle = () => {
    const next = themes[(themes.indexOf(theme) + 1) % themes.length];
    setTheme(next); localStorage.setItem("formatbase.theme", next); apply(next);
  };
  return <button className="theme-toggle" type="button" onClick={cycle} aria-label={`Theme: ${theme}. Change theme`} title={`Theme: ${theme}`}>{theme === "dark" ? "◐" : theme === "light" ? "☼" : "◑"}<span>{theme}</span></button>;
}
