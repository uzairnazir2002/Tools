export function downloadMime(language: string): string {
  if (language === "json") return "application/json;charset=utf-8";
  if (language === "yaml") return "application/yaml;charset=utf-8";
  if (language === "xml") return "application/xml;charset=utf-8";
  if (language === "csv") return "text/csv;charset=utf-8";
  if (language === "sql") return "application/sql;charset=utf-8";
  return "text/plain;charset=utf-8";
}
