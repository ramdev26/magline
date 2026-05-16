import type { ApiRequest, ApiResponse } from "../types.js";
import { withAuth } from "./with-auth.js";

export function protect(
  handler: (req: ApiRequest, res: ApiResponse) => Promise<void>
) {
  return withAuth(async (req, res) => handler(req, res));
}
