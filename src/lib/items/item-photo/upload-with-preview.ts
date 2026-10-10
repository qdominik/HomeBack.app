/** Roll back only an upload confirmed as newly created by this operation. */
export async function uploadItemPhotoWithPreview(input: {
  upload: () => Promise<{ error: unknown }>;
  preview: () => Promise<{ data: { signedUrl: string } | null; error: unknown }>;
  removeUploaded: () => Promise<unknown>;
}): Promise<
  | { ok: true; previewUrl: string }
  | { ok: false; code: "upload_failed" | "preview_url_failed" }
> {
  try {
    const uploaded = await input.upload();
    if (uploaded.error) return { ok: false, code: "upload_failed" };
  } catch {
    // An uncertain/failed upload does not establish ownership of a stored file.
    return { ok: false, code: "upload_failed" };
  }

  try {
    const preview = await input.preview();
    if (!preview.error && preview.data?.signedUrl) {
      return { ok: true, previewUrl: preview.data.signedUrl };
    }
  } catch {
    // Use the same controlled error for thrown and returned preview failures.
  }

  try {
    await input.removeUploaded();
  } catch {
    // Cleanup is best effort; preserve the original, safe preview failure.
  }
  return { ok: false, code: "preview_url_failed" };
}
