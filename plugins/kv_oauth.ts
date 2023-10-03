// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { Plugin } from "$fresh/server.ts";
import {
  createGitHubOAuthConfig,
  handleCallback,
  signIn,
  signOut,
} from "kv_oauth";
import {
  createUser,
  getUser,
  updateUserSession,
  type User,
} from "@/utils/db.ts";
import { isStripeEnabled, stripe } from "@/utils/stripe.ts";
import { createHttpError } from "std/http/http_errors.ts";

const oauthConfig = createGitHubOAuthConfig();

interface GitHubUser {
  login: string;
  email: string;
}

/**
 * Returns the GitHub profile information of the user with the given access
 * token.
 *
 * @see {@link https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-the-authenticated-user}
 *
 * @example
 * ```ts
 * import { getGitHubUser } from "@/plugins/kv_oauth.ts";
 *
 * const user = await getGitHubUser("<access token>");
 * user.login; // Returns "octocat"
 * user.email; // Returns "octocat@github.com"
 * ```
 */
export async function getGitHubUser(accessToken: string) {
  const resp = await fetch("https://api.github.com/user", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) {
    const { message } = await resp.json();
    throw createHttpError(resp.status, message);
  }
  return await resp.json() as Promise<GitHubUser>;
}

/**
 * This custom plugin centralizes all authentication logic using the
 * {@link https://deno.land/x/deno_kv_oauth|Deno KV OAuth} module.
 *
 * The implementation is based off Deno KV OAuth's own
 * {@link https://deno.land/x/deno_kv_oauth/src/fresh_plugin.ts?source|Fresh plugin}
 * implementation.
 */
export default {
  name: "kv-oauth",
  routes: [
    {
      path: "/signin",
      handler: async (req) => await signIn(req, oauthConfig),
    },
    {
      path: "/callback",
      handler: async (req) => {
        const { response, tokens, sessionId } = await handleCallback(
          req,
          oauthConfig,
        );

        const githubUser = await getGitHubUser(tokens.accessToken);
        const user = await getUser(githubUser.login);

        if (user === null) {
          const user: User = {
            login: githubUser.login,
            sessionId,
            isSubscribed: false,
          };
          if (isStripeEnabled()) {
            const customer = await stripe.customers.create();
            user.stripeCustomerId = customer.id;
          }
          await createUser(user);
        } else {
          await updateUserSession(user, sessionId);
        }

        return response;
      },
    },
    {
      path: "/signout",
      handler: signOut,
    },
  ],
} as Plugin;
