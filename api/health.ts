import type { ApiRequest, ApiResponse } from "./types";
import { prisma } from "./lib/prisma.js";

export default async function handler(_req: ApiRequest, res: ApiResponse) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", database: "connected" });
  } catch {
    res.status(200).json({ status: "ok", database: "pending" });
  }
}
