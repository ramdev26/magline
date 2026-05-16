import type { ApiRequest, ApiResponse } from "./types";
import { createUser, listUsers } from "./lib/auth-handlers.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method === "GET") return await listUsers(req, res);
    if (req.method === "POST") return await createUser(req, res);
    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("users error:", error);
    res.status(500).json({ error: "Failed to process user request" });
  }
}
