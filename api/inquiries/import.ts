import type { ApiRequest, ApiResponse } from "../types";
import { bulkImportInquiries } from "../lib/handlers.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    return await bulkImportInquiries(req, res);
  } catch (error) {
    console.error("import error:", error);
    res.status(500).json({ error: "Failed to import inquiries" });
  }
}
