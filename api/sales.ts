import type { ApiRequest, ApiResponse } from "./types";
import { sales } from "./lib/handlers.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    return await sales(req, res);
  } catch (error) {
    console.error("sales error:", error);
    res.status(500).json({ error: "Failed to process sales request" });
  }
}
