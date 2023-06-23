// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import {
  createUser,
  deleteUserBySession,
  getUser,
  incrementAnalyticsMetricPerDay,
  newUserProps,
  updateUser,
  type User,
} from "@/utils/db.ts";
import { stripe } from "@/utils/payments.ts";
import { State } from "./_middleware.ts";
import { handleCallback } from "kv_oauth";
import { oauth2Client } from "@/utils/oauth2_client.ts";
import {
  deleteRedirectUrlCookie,
  getRedirectUrlCookie,
} from "@/utils/redirect.ts";

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  email: string;
}

async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
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
    const { response, accessToken, sessionId } = await handleCallback(
      req,
      oauth2Client,
      getRedirectUrlCookie(req.headers),
    );

    deleteRedirectUrlCookie(response.headers);

    const githubUser = await getGitHubUser(accessToken);

    const user = await getUser(githubUser.id.toString());
    if (!user) {
      const customer = await stripe.customers.create({
        email: githubUser.email,
      });
      const user: User = {
        id: githubUser.id.toString(),
        login: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        stripeCustomerId: customer.id,
        sessionId,
        ...newUserProps(),
      };
      await createUser(user);
      await incrementAnalyticsMetricPerDay("users_count", new Date());
    } else {
      await deleteUserBySession(sessionId);
      await updateUser({ ...user, sessionId });
    }
    return response;
  },
};
