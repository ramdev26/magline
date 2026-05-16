import type { ApiRequest, ApiResponse } from "../types";
import { updateUserHandler } from "../lib/auth-handlers.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const id = (req as ApiRequest & { query?: { id?: string } }).query?.id;
  if (!id) {
    res.status(400).json({ error: "User id required" });
    return;
  }

  try {
    return await updateUserHandler(id)(req, res);
  } catch (error) {
    console.error("user update error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
}
