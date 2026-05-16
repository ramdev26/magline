import type { ApiRequest, ApiResponse } from "../types";
import { login } from "../lib/auth-handlers.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    return await login(req, res);
  } catch (error) {
    console.error("login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
}
