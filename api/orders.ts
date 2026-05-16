import type { ApiRequest, ApiResponse } from "./types";
import { inquiries } from "./lib/handlers.js";

/** Legacy route — same as /api/inquiries */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    return await inquiries(req, res);
  } catch (error) {
    console.error("orders error:", error);
    res.status(500).json({ error: "Failed to process inquiry request" });
  }
}
