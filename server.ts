import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import type { ApiRequest, ApiResponse } from "./api/types";
import { bulkImportInquiries, dashboard, customers, inquiries, sales, updateInquiry } from "./api/lib/handlers";
import { prisma } from "./api/lib/prisma";

function wrap(
  handler: (req: ApiRequest, res: ApiResponse) => Promise<void>
) {
  return async (req: express.Request, res: express.Response) => {
    try {
      await handler(req as ApiRequest, res as unknown as ApiResponse);
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
  app.get("/api/dashboard", wrap(dashboard));
  app.get("/api/customers", wrap(customers));
  app.post("/api/customers", wrap(customers));
  app.get("/api/inquiries", wrap(inquiries));
  app.post("/api/inquiries", wrap(inquiries));
  app.post("/api/inquiries/import", wrap(bulkImportInquiries));
  app.put("/api/inquiries/:id", async (req, res) => {
    try {
      await updateInquiry(req as ApiRequest, res as unknown as ApiResponse, req.params.id);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get("/api/orders", wrap(inquiries));
  app.post("/api/orders", wrap(inquiries));
  app.get("/api/sales", wrap(sales));
  app.post("/api/sales", wrap(sales));

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
