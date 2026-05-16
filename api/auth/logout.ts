import type { ApiRequest, ApiResponse } from "../types";
import { logout } from "../lib/auth-handlers.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    return await logout(req, res);
  } catch (error) {
    console.error("logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
}
