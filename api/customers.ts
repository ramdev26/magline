import type { ApiRequest, ApiResponse } from "./types";
import { customers } from "./lib/handlers.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    return await customers(req, res);
  } catch (error) {
    console.error("customers error:", error);
    res.status(500).json({ error: "Failed to process customer request" });
  }
}
