import type { ApiRequest, ApiResponse } from "../types.js";
import { prisma } from "./prisma.js";
import {
  clearSessionCookie,
  hashPassword,
  sessionCookie,
  signToken,
  verifyPassword,
} from "./auth.js";
import { withAuth } from "./with-auth.js";

function parseBody(req: ApiRequest) {
  return (req.body ?? {}) as Record<string, unknown>;
}

function mapUser(row: { id: string; email: string; name: string; role: string; active: boolean; createdAt: Date }) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function login(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = parseBody(req);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const authUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "SUPER_ADMIN" | "USER",
  };
  const token = await signToken(authUser);

  res.setHeader?.("Set-Cookie", sessionCookie(token));
  return res.status(200).json({ token, user: authUser });
}

export async function logout(_req: ApiRequest, res: ApiResponse) {
  res.setHeader?.("Set-Cookie", clearSessionCookie());
  return res.status(200).json({ ok: true });
}

export const me = withAuth(async (_req, res, user) => {
  return res.status(200).json({ user });
});

export const listUsers = withAuth(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
  });
  return res.status(200).json(users.map(mapUser));
}, { superAdminOnly: true });

export const createUser = withAuth(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = parseBody(req);
  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim();
  const password = String(body.password ?? "");
  if (!email || !name || password.length < 10) {
    return res.status(400).json({
      error: "Name, email, and password (min 10 characters) are required",
    });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "A user with this email already exists" });
  }

  const created = await prisma.user.create({
    data: {
      email,
      name,
      role: "USER",
      passwordHash: await hashPassword(password),
    },
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
  });

  return res.status(201).json(mapUser(created));
}, { superAdminOnly: true });

export function updateUserHandler(userId: string) {
  return withAuth(async (req, res) => {
    if (req.method !== "PATCH" && req.method !== "PUT") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = parseBody(req);
    const data: {
      name?: string;
      active?: boolean;
      passwordHash?: string;
    } = {};

    if (body.name != null) data.name = String(body.name).trim();
    if (body.active != null) data.active = Boolean(body.active);
    if (body.password != null) {
      const password = String(body.password);
      if (password.length < 10) {
        return res.status(400).json({ error: "Password must be at least 10 characters" });
      }
      data.passwordHash = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    });

    return res.status(200).json(mapUser(updated));
  }, { superAdminOnly: true });
}
