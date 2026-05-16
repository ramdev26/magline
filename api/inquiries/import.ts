import type { ApiRequest, ApiResponse } from "../types";
import { bulkImportInquiries } from "../lib/handlers.js";
import { protect } from "../lib/protect.js";

const authed = protect(bulkImportInquiries);

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    return await authed(req, res);
  } catch (error) {
    console.error("import error:", error);
    res.status(500).json({ error: "Failed to import inquiries" });
  }
}
