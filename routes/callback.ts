// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  createUser,
  deleteUserBySession,
  getUser,
  newUserProps,
  updateUser,
  type User,
} from "@/utils/db.ts";
import { stripe } from "@/utils/payments.ts";
import { handleCallback } from "kv_oauth";
import { oauth2Client } from "@/utils/oauth2_client.ts";
import {
  deleteRedirectUrlCookie,
  getRedirectUrlCookie,
} from "@/utils/redirect.ts";

interface GitHubUser {
  login: string;
  email: string;
}

async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const resp = await fetch("https://api.github.com/user", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) {
    await resp.body?.cancel();
    throw new Error();
  }
  return await resp.json() as GitHubUser;
}

export default async function CallbackPage(req: Request) {
  const { response, accessToken, sessionId } = await handleCallback(
    req,
    oauth2Client,
    getRedirectUrlCookie(req.headers),
  );

  deleteRedirectUrlCookie(response.headers);

  const githubUser = await getGitHubUser(accessToken);

  const user = await getUser(githubUser.login);
  if (!user) {
    let stripeCustomerId = undefined;
    if (stripe) {
      const customer = await stripe.customers.create({
        email: githubUser.email,
      });
      stripeCustomerId = customer.id;
    }
    const user: User = {
      login: githubUser.login,
      stripeCustomerId,
      sessionId,
      ...newUserProps(),
    };
    await createUser(user);
  } else {
    await deleteUserBySession(sessionId);
    await updateUser({ ...user, sessionId });
  }
  return response;
}
