export const candidateDomain = "formatvalidateconvert.com";

export function contactEmail(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return configured || undefined;
}
