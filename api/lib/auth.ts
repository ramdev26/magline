import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { ApiRequest } from "../types.js";
import type { AuthUser } from "../types.js";

const COOKIE_NAME = "magline_session";
const TOKEN_TTL = "7d";

export function getSessionSecret() {
  const secret =
    process.env.SESSION_SECRET ??
    (process.env.NODE_ENV === "production"
      ? undefined
      : "magline-dev-session-secret-min-32-chars");
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set (min 32 characters)");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signToken(user: AuthUser) {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSessionSecret());
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.name !== "string") {
      return null;
    }
    const role = payload.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "USER";
    return {
      id: String(payload.sub),
      email: payload.email,
      name: payload.name,
      role,
    };
  } catch {
    return null;
  }
}

function parseCookies(req: ApiRequest) {
  const raw = req.headers?.cookie;
  if (!raw || typeof raw !== "string") return {} as Record<string, string>;
  return Object.fromEntries(
    raw.split(";").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, decodeURIComponent(rest.join("="))];
    })
  );
}

export function getTokenFromRequest(req: ApiRequest) {
  const auth = req.headers?.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  const cookies = parseCookies(req);
  return cookies[COOKIE_NAME] ?? null;
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export async function getAuthUser(req: ApiRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}
