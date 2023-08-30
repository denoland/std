// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { signIn } from "kv_oauth";
import { oauth2Client } from "@/utils/oauth2_client.ts";

export default async function SignInPage(req: Request) {
  return await signIn(req, oauth2Client);
}
