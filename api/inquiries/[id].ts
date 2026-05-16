import type { ApiRequest, ApiResponse } from "../types";
import { updateInquiry } from "../lib/handlers.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const id = (req as ApiRequest & { query?: { id?: string } }).query?.id;
  if (!id) {
    return res.status(400).json({ error: "Inquiry id is required" });
  }

  try {
    return await updateInquiry(req, res, id);
  } catch (error) {
    console.error("update inquiry error:", error);
    res.status(500).json({ error: "Failed to update inquiry" });
  }
}
