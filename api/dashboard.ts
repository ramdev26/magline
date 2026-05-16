import type { ApiRequest, ApiResponse } from "./types";
import { dashboard } from "./lib/handlers.js";
import { protect } from "./lib/protect.js";

const authed = protect(dashboard);

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    return await authed(req, res);
  } catch (error) {
    console.error("dashboard error:", error);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
}
