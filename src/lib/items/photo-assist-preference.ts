export const PHOTO_ASSIST_LIMIT = 3;

export function photoAssistCount(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? Math.min(value, PHOTO_ASSIST_LIMIT)
    : 0;
}

export function shouldShowPhotoAssist(metadata: Record<string, unknown>, existingCount: number): boolean {
  return metadata.photo_assist_dismissed !== true &&
    Math.max(photoAssistCount(metadata.photo_assist_created), existingCount) < PHOTO_ASSIST_LIMIT;
}

export function nextPhotoAssistCount(metadata: Record<string, unknown>, existingCount: number): number {
  return Math.min(PHOTO_ASSIST_LIMIT, Math.max(photoAssistCount(metadata.photo_assist_created) + 1, existingCount));
}
