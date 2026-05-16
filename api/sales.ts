import type { ApiRequest, ApiResponse } from "./types";
import { sales } from "./lib/handlers.js";
import { protect } from "./lib/protect.js";

const authed = protect(sales);

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    return await authed(req, res);
  } catch (error) {
    console.error("sales error:", error);
    res.status(500).json({ error: "Failed to process sales request" });
  }
}
