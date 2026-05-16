import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import type { ApiRequest, ApiResponse } from "./api/types";
import { bulkImportInquiries, dashboard, customers, inquiries, sales, updateInquiry } from "./api/lib/handlers";
import { login, logout, me, listUsers, createUser, updateUserHandler } from "./api/lib/auth-handlers";
import { protect } from "./api/lib/protect";
import { prisma } from "./api/lib/prisma";

function toApiReq(req: express.Request): ApiRequest {
  return {
    method: req.method,
    body: req.body as Record<string, unknown>,
    headers: req.headers as ApiRequest["headers"],
  };
}

function wrap(
  handler: (req: ApiRequest, res: ApiResponse) => Promise<void>
) {
  return async (req: express.Request, res: express.Response) => {
    try {
      await handler(toApiReq(req), res as unknown as ApiResponse);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  app.get("/api/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ok", database: "connected" });
    } catch {
      res.json({ status: "ok", database: "pending" });
    }
  });

  app.post("/api/auth/login", wrap(login));
  app.post("/api/auth/logout", wrap(logout));
  app.get("/api/auth/me", wrap(me));

  app.get("/api/users", wrap(listUsers));
  app.post("/api/users", wrap(createUser));
  app.patch("/api/users/:id", async (req, res) => {
    try {
      await updateUserHandler(req.params.id)(toApiReq(req), res as unknown as ApiResponse);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.put("/api/users/:id", async (req, res) => {
    try {
      await updateUserHandler(req.params.id)(toApiReq(req), res as unknown as ApiResponse);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/dashboard", wrap(protect(dashboard)));
  app.get("/api/customers", wrap(protect(customers)));
  app.post("/api/customers", wrap(protect(customers)));
  app.get("/api/inquiries", wrap(protect(inquiries)));
  app.post("/api/inquiries", wrap(protect(inquiries)));
  app.post("/api/inquiries/import", wrap(protect(bulkImportInquiries)));
  app.put("/api/inquiries/:id", async (req, res) => {
    try {
      await protect(async (r, re) => updateInquiry(r, re, req.params.id))(toApiReq(req), res as unknown as ApiResponse);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get("/api/orders", wrap(protect(inquiries)));
  app.post("/api/orders", wrap(protect(inquiries)));
  app.get("/api/sales", wrap(protect(sales)));
  app.post("/api/sales", wrap(protect(sales)));

  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
