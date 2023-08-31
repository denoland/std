// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { Plugin } from "$fresh/server.ts";
import {
  createGitHubOAuth2Client,
  handleCallback,
  signIn,
  signOut,
} from "kv_oauth";
import {
  createUser,
  deleteUserBySession,
  getUser,
  newUserProps,
  updateUser,
  type User,
} from "@/utils/db.ts";
import { stripe } from "@/utils/payments.ts";

const oauth2Client = createGitHubOAuth2Client();

// deno-lint-ignore no-explicit-any
async function getGitHubUser(accessToken: string): Promise<any> {
  const response = await fetch("https://api.github.com/user", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const { message } = await response.json();
    throw new Error(message);
  }
  return await response.json();
}

/**
 * This custom plugin centralizes all authentication logic using the {@link https://deno.land/x/deno_kv_oauth|Deno KV OAuth} module.
 *
 * The implementation is based off Deno KV OAuth's own {@link https://deno.land/x/deno_kv_oauth/src/fresh_plugin.ts?source|Fresh plugin implementation}.
 */
export default {
  name: "kv-oauth",
  routes: [
    {
      path: "/signin",
      handler: async (req) => await signIn(req, oauth2Client),
    },
    {
      path: "/callback",
      handler: async (req) => {
        const { response, accessToken, sessionId } = await handleCallback(
          req,
          oauth2Client,
        );

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
      },
    },
    {
      path: "/signout",
      handler: signOut,
    },
  ],
} as Plugin;
