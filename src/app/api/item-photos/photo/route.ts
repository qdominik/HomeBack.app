import { NextRequest, NextResponse } from "next/server";
import {
  isItemPhotoPreviewPathForHousehold,
} from "@/lib/items/item-photo-preview-url";
import {
  ITEM_PHOTO_BUCKET,
  ITEM_PHOTO_SIGNED_URL_TTL_SECONDS,
} from "@/lib/items/item-photo-storage";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const storagePath = request.nextUrl.searchParams.get("path") ?? "";
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return new NextResponse(null, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profile")
    .select("household_id, status")
    .eq("id", userId)
    .maybeSingle();

  if (
    error ||
    !profile?.household_id ||
    profile.status !== "aktywny"
  ) {
    return new NextResponse(null, { status: 404 });
  }

  if (!isItemPhotoPreviewPathForHousehold(storagePath, profile.household_id)) {
    return new NextResponse(null, { status: 404 });
  }

  const { data, error: signedUrlError } = await supabase.storage
    .from(ITEM_PHOTO_BUCKET)
    .createSignedUrl(storagePath, ITEM_PHOTO_SIGNED_URL_TTL_SECONDS);

  if (signedUrlError || !data?.signedUrl) {
    return new NextResponse(null, { status: 404 });
  }

  const response = await fetch(data.signedUrl, { cache: "no-store" });

  if (!response.ok) {
    return new NextResponse(null, { status: response.status });
  }

  const body = await response.arrayBuffer();

  return new NextResponse(body, {
    headers: {
      "Cache-Control": "private, max-age=60",
      "Content-Length": String(body.byteLength),
      "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
    },
  });
}
