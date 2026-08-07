import {
  isItemPhotoDraftPathForHousehold,
  isItemPhotoFinalPathForHousehold,
} from "./item-photo-storage";

export const ITEM_PHOTO_PREVIEW_ROUTE = "/api/item-photos/photo";

export function buildItemPhotoPreviewUrl(storagePath: string) {
  return `${ITEM_PHOTO_PREVIEW_ROUTE}?path=${encodeURIComponent(storagePath)}`;
}

export function isItemPhotoPreviewPathForHousehold(
  storagePath: string,
  householdId: string,
) {
  return (
    isItemPhotoDraftPathForHousehold(storagePath, householdId) ||
    isItemPhotoFinalPathForHousehold(storagePath, householdId)
  );
}
