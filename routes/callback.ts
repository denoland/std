// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import {
  createUser,
  getUserById,
  setUserSessionId,
  type User,
} from "@/utils/db.ts";
import { stripe } from "@/utils/payments.ts";
import { State } from "./_middleware.ts";
import { handleCallback } from "deno_kv_oauth";
import { client } from "@/utils/kv_oauth.ts";

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
    const { response, tokens, sessionId } = await handleCallback(req, client);

    const githubUser = await getUser(tokens.accessToken);

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
      await setUserSessionId(user, sessionId);
    }

    return response;
  },
};
