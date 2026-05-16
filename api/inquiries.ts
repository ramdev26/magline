import type { ApiRequest, ApiResponse } from "./types";
import { inquiries } from "./lib/handlers.js";
import { protect } from "./lib/protect.js";

const authed = protect(inquiries);

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    return await authed(req, res);
  } catch (error) {
    console.error("inquiries error:", error);
    res.status(500).json({ error: "Failed to process inquiry request" });
  }
}
