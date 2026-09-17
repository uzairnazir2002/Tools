import type { NextConfig } from "next";
const nextConfig: NextConfig = { transpilePackages: ["@formatbase/tool-core", "@formatbase/tool-registry", "@formatbase/json-engine", "@formatbase/sql-engine", "@formatbase/yaml-engine", "@formatbase/xml-engine", "@formatbase/csv-engine", "@formatbase/conversion-engine", "@formatbase/analytics", "@formatbase/worker-runtime", "@formatbase/seo", "@formatbase/editor"] };
export default nextConfig;
