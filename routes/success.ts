// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { redirect } from "@/utils/http.ts";
import { createUser, getUserById, type User } from "@/utils/db.ts";
import { stripe } from "@/utils/payments.ts";
import { State } from "./_middleware.ts";
import { getUser } from "deno_kv_oauth";
import { provider } from "@/utils/provider.ts";

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  email: string;
}

// deno-lint-ignore no-explicit-any
export const handler: Handlers<any, State> = {
  async GET(req, ctx) {
    if (!ctx.state.isSignedIn) {
      return redirect("/");
    }
    const githubUser: GitHubUser = await getUser(req, provider);
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
    }

    return redirect("/");
  },
};
