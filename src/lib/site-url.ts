export function getConfiguredSiteUrl(): URL | null {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!value) {
    return null;
  }

  try {
    const siteUrl = new URL(value);

    return siteUrl.protocol === "http:" || siteUrl.protocol === "https:"
      ? siteUrl
      : null;
  } catch {
    return null;
  }
}
