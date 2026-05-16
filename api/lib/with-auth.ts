import type { ApiRequest, ApiResponse, AuthUser } from "../types.js";
import { getAuthUser } from "./auth.js";

type AuthedHandler = (req: ApiRequest, res: ApiResponse, user: AuthUser) => Promise<void>;

export function withAuth(handler: AuthedHandler, options?: { superAdminOnly?: boolean }) {
  return async (req: ApiRequest, res: ApiResponse) => {
    const user = await getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (options?.superAdminOnly && user.role !== "SUPER_ADMIN") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    return handler(req, res, user);
  };
}
