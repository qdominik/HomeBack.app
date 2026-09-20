import { NextResponse, type NextRequest } from "next/server";
import { getAppBaseUrl } from "@/lib/email/config";
import {
  invitationCookieMaxAge,
  invitationCookieName,
  isInvitationToken,
} from "@/lib/people/invitation-session";
import { areHouseholdInvitationsEnabled } from "@/lib/people/invitations-enabled";

export async function POST(request: NextRequest) {
  if (!areHouseholdInvitationsEnabled()) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  let token: unknown;
  try {
    token = (await request.json()).token;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!isInvitationToken(token)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let secure: boolean;
  try {
    secure = new URL(getAppBaseUrl()).protocol === "https:";
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(invitationCookieName, token, {
    httpOnly: true,
    maxAge: invitationCookieMaxAge,
    path: "/invite",
    sameSite: "lax",
    secure,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(invitationCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/invite",
    sameSite: "lax",
    secure: process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "production",
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
