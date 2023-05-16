// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { redirect } from "@/utils/http.ts";
import {
  createUser,
  getUserById,
  setUserSession,
  type User,
} from "@/utils/db.ts";
import { stripe } from "@/utils/payments.ts";
import { State } from "./_middleware.ts";
import { getAccessToken, setCallbackHeaders } from "@/utils/deno_kv_oauth.ts";
import { oauth2Client } from "@/utils/oauth2_client.ts";

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  email: string;
}

async function getUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch("https://api.github.com/user", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error();
  }
  return await response.json() as GitHubUser;
}

// deno-lint-ignore no-explicit-any
export const handler: Handlers<any, State> = {
  async GET(req) {
    const accessToken = await getAccessToken(req, oauth2Client);
    const githubUser = await getUser(accessToken);
    const sessionId = crypto.randomUUID();

    const user = await getUserById(githubUser.id.toString());
    if (!user) {
      const customer = await stripe.customers.create({
        email: githubUser.email,
      });
      const userInit: Omit<User, "isSubscribed"> | null = {
        id: githubUser.id.toString(),
        login: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        stripeCustomerId: customer.id,
        sessionId,
      };
      await createUser(userInit);
    } else {
      await setUserSession(user, sessionId);
    }

    const response = redirect("/");
    setCallbackHeaders(response.headers, sessionId);
    return response;
  },
};
