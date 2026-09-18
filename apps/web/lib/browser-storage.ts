import { siteConfig } from "@codeformattools/seo";

export function migratedStorageValue(key: string, valid: (value: string) => boolean): string | null {
  const nextKey = `${siteConfig.storagePrefix}.${key}`;
  const legacyKey = `${siteConfig.legacyStoragePrefix}.${key}`;
  const current = localStorage.getItem(nextKey);
  if (current !== null) return valid(current) ? current : null;
  const legacy = localStorage.getItem(legacyKey);
  if (legacy !== null && valid(legacy)) {
    localStorage.setItem(nextKey, legacy);
    localStorage.removeItem(legacyKey);
    return legacy;
  }
  return null;
}

export function setStorageValue(key: string, value: string): void {
  localStorage.setItem(`${siteConfig.storagePrefix}.${key}`, value);
  localStorage.removeItem(`${siteConfig.legacyStoragePrefix}.${key}`);
}
