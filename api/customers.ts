import type { ApiRequest, ApiResponse } from "./types";
import { customers } from "./lib/handlers.js";
import { protect } from "./lib/protect.js";

const authed = protect(customers);

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    return await authed(req, res);
  } catch (error) {
    console.error("customers error:", error);
    res.status(500).json({ error: "Failed to process customer request" });
  }
}
