import type { Handlers } from "$fresh/server.ts";
import { handleOAuthCallback } from "../../utils/auth_kv.ts";

export const handler: Handlers = {
  async GET(req) {
    return await handleOAuthCallback(req);
  },
};
