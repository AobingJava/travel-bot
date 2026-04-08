import "server-only";

import { createHash } from "node:crypto";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { appEnv } from "@/lib/env";
import type { SessionUser } from "@/lib/types";

const sessionCookieName = "wander_session";
const encoder = new TextEncoder();

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    email: user.email,
    name: user.name,
    avatarText: user.avatarText,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(encoder.encode(appEnv.authSecret));
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, "", {
    path: "/",
    expires: new Date(0),
  });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, encoder.encode(appEnv.authSecret));
    return {
      email: String(verified.payload.email),
      name: String(verified.payload.name),
      avatarText: String(verified.payload.avatarText),
    } satisfies SessionUser;
  } catch {
    return null;
  }
}
