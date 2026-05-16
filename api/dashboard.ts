import type { ApiRequest, ApiResponse } from "./types";
import { dashboard } from "./lib/handlers.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    return await dashboard(req, res);
  } catch (error) {
    console.error("dashboard error:", error);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
}
