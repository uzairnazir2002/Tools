import { siteConfig } from "@codeformattools/seo";

export function migratedStorageValue(key: string, valid: (value: string) => boolean): string | null {
  const nextKey = `${siteConfig.storagePrefix}.${key}`;
  const current = localStorage.getItem(nextKey);
  if (current !== null) return valid(current) ? current : null;
  for (const prefix of siteConfig.legacyStoragePrefixes) {
    const legacyKey = `${prefix}.${key}`;
    const legacy = localStorage.getItem(legacyKey);
    if (legacy !== null && valid(legacy)) {
      localStorage.setItem(nextKey, legacy);
      for (const legacyPrefix of siteConfig.legacyStoragePrefixes) localStorage.removeItem(`${legacyPrefix}.${key}`);
      return legacy;
    }
  }
  return null;
}

export function setStorageValue(key: string, value: string): void {
  localStorage.setItem(`${siteConfig.storagePrefix}.${key}`, value);
  for (const prefix of siteConfig.legacyStoragePrefixes) localStorage.removeItem(`${prefix}.${key}`);
}
