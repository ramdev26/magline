import type { ApiRequest, ApiResponse } from "../types";
import { me } from "../lib/auth-handlers.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    return await me(req, res);
  } catch (error) {
    console.error("me error:", error);
    res.status(500).json({ error: "Session check failed" });
  }
}
