import assert from "node:assert/strict";
import test from "node:test";
import { siteOrigin } from "../src/index.ts";

test("siteOrigin prefers explicit production URL and trims trailing slash", () => {
  const previousSite = process.env.NEXT_PUBLIC_SITE_URL;
  const previousVercel = process.env.VERCEL_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://tools-web-ten-ruddy.vercel.app/";
  process.env.VERCEL_URL = "preview.example.vercel.app";
  assert.equal(siteOrigin(), "https://tools-web-ten-ruddy.vercel.app");
  process.env.NEXT_PUBLIC_SITE_URL = previousSite;
  process.env.VERCEL_URL = previousVercel;
});

test("siteOrigin uses Vercel URL when no explicit origin is configured", () => {
  const previousSite = process.env.NEXT_PUBLIC_SITE_URL;
  const previousVercel = process.env.VERCEL_URL;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  process.env.VERCEL_URL = "tools-web-ten-ruddy.vercel.app";
  assert.equal(siteOrigin(), "https://tools-web-ten-ruddy.vercel.app");
  process.env.NEXT_PUBLIC_SITE_URL = previousSite;
  process.env.VERCEL_URL = previousVercel;
});
