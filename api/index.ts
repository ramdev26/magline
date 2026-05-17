import type { ApiRequest, ApiResponse } from "./types";
import { login, logout, me, listUsers, createUser, updateUserHandler } from "./lib/auth-handlers.js";
import {
  bulkImportInquiries,
  createEngineer,
  customers,
  dashboard,
  engineers,
  inquiries,
  listAllEngineers,
  sales,
  updateCustomer,
  updateEngineer,
  updateInquiry,
  updateSalesManager,
  updateSalesPerson,
} from "./lib/handlers.js";
import { deleteWip, listOrCreateWip, updateWip } from "./lib/wip-handlers.js";
import { protect } from "./lib/protect.js";
import { withAuth } from "./lib/with-auth.js";
import { prisma } from "./lib/prisma.js";

type VercelLikeRequest = {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
};

function parseBody(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === "object" && !Buffer.isBuffer(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function getRoute(req: VercelLikeRequest) {
  const fromQuery = req.query?.path;
  if (fromQuery) {
    return Array.isArray(fromQuery) ? fromQuery.join("/") : fromQuery;
  }

  const url = req.url ?? "";
  const pathOnly = url.split("?")[0];
  const match = pathOnly.match(/\/api\/?(.*)$/);
  return match?.[1] ?? "";
}

function toApiRequest(req: VercelLikeRequest): ApiRequest {
  return {
    method: req.method,
    body: parseBody(req.body),
    headers: req.headers,
    query: req.query,
  };
}

export default async function handler(req: VercelLikeRequest, res: ApiResponse) {
  const route = getRoute(req).replace(/^\/+|\/+$/g, "");
  const segments = route ? route.split("/") : [];
  const apiReq = toApiRequest(req);

  try {
    if (route === "health" && req.method === "GET") {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return res.status(200).json({ status: "ok", database: "connected" });
      } catch {
        return res.status(200).json({ status: "ok", database: "pending" });
      }
    }

    if (route === "auth/login" && req.method === "POST") {
      return await login(apiReq, res);
    }
    if (route === "auth/logout" && req.method === "POST") {
      return await logout(apiReq, res);
    }
    if (route === "auth/me" && req.method === "GET") {
      return await me(apiReq, res);
    }

    if (route === "users" && req.method === "GET") {
      return await listUsers(apiReq, res);
    }
    if (route === "users" && req.method === "POST") {
      return await createUser(apiReq, res);
    }
    if (segments[0] === "users" && segments[1] && (req.method === "PATCH" || req.method === "PUT")) {
      return await updateUserHandler(segments[1])(apiReq, res);
    }

    if (route === "dashboard" && req.method === "GET") {
      return await protect(dashboard)(apiReq, res);
    }
    if (route === "customers") {
      return await protect(customers)(apiReq, res);
    }
    if (segments[0] === "customers" && segments[1] && (req.method === "PATCH" || req.method === "PUT")) {
      return await protect(async (r, re) => updateCustomer(r, re, segments[1]))(apiReq, res);
    }
    if (route === "sales") {
      return await protect(sales)(apiReq, res);
    }
    if (segments[0] === "sales" && segments[1] === "managers" && segments[2]) {
      return await withAuth(
        async (r, re) => updateSalesManager(r, re, segments[2]),
        { superAdminOnly: true }
      )(apiReq, res);
    }
    if (segments[0] === "sales" && segments[1] === "persons" && segments[2]) {
      return await withAuth(
        async (r, re) => updateSalesPerson(r, re, segments[2]),
        { superAdminOnly: true }
      )(apiReq, res);
    }
    if (route === "engineers" && req.method === "GET") {
      return await protect(engineers)(apiReq, res);
    }
    if (route === "engineers" && req.method === "POST") {
      return await withAuth(async (r, re) => createEngineer(r, re), { superAdminOnly: true })(apiReq, res);
    }
    if (route === "engineers/all" && req.method === "GET") {
      return await withAuth(async (r, re) => listAllEngineers(r, re), { superAdminOnly: true })(apiReq, res);
    }
    if (segments[0] === "engineers" && segments[1] && segments[1] !== "all") {
      return await withAuth(
        async (r, re) => updateEngineer(r, re, segments[1]),
        { superAdminOnly: true }
      )(apiReq, res);
    }
    if (route === "orders" || route === "inquiries") {
      return await protect(inquiries)(apiReq, res);
    }
    if (route === "inquiries/import" && req.method === "POST") {
      return await protect(bulkImportInquiries)(apiReq, res);
    }
    if (segments[0] === "inquiries" && segments[1] && segments[1] !== "import") {
      return await protect(async (r, re) => updateInquiry(r, re, segments[1]))(apiReq, res);
    }

    if (route === "wip") {
      return await protect(listOrCreateWip)(apiReq, res);
    }
    if (segments[0] === "wip" && segments[1]) {
      if (req.method === "DELETE") {
        return await protect(async (r, re) => deleteWip(r, re, segments[1]))(apiReq, res);
      }
      return await protect(async (r, re) => updateWip(r, re, segments[1]))(apiReq, res);
    }

    return res.status(404).json({ error: "Not found", route });
  } catch (error) {
    console.error("API error:", route, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
