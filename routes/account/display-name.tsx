// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import Logo from "@/components/Logo.tsx";
import Head from "@/components/Head.tsx";
import {
  BUTTON_STYLES,
  INPUT_STYLES,
  NOTICE_STYLES,
} from "@/utils/constants.ts";
import {
  getOrCreateUser,
  getUserDisplayName,
  setUserDisplayName,
  type User,
} from "@/utils/db.ts";
import type { AccountState } from "./_middleware.ts";
import { redirect } from "@/utils/http.ts";

interface DisplayNamePageData {
  user: User;
}

export const handler: Handlers<DisplayNamePageData, AccountState> = {
  async GET(_req, ctx) {
    const user = await getOrCreateUser(
      ctx.state.session.user.id,
      ctx.state.session.user.email!,
    );
    return ctx.render({ user });
  },
  async POST(req, ctx) {
    try {
      const form = await req.formData();
      const displayName = form.get("display_name");

      if (typeof displayName !== "string") {
        throw new Error("Display name must be a string");
      }

      await setUserDisplayName(ctx.state.session.user.id, displayName);
      return redirect("/account");
    } catch (error) {
      return redirect(
        `/account/display-name?error=${encodeURIComponent(error.message)}`,
      );
    }
  },
};

const POSSIBLE_ERROR_MESSAGES = [
  "Display name must be a string",
  "User does not exist",
];

export default function DisplayNamePage(props: PageProps<DisplayNamePageData>) {
  const errorMessage = props.url.searchParams.get("error");

  return (
    <>
      <Head title="Change display name" href={props.url.href} />
      <div class="max-w-xs flex h-screen m-auto">
        <div class="m-auto w-72">
          <a href="/">
            <Logo class="mb-8" />
          </a>
          <h1 class="text-center my-8 text-2xl font-bold">
            Change display name
          </h1>
          {errorMessage && POSSIBLE_ERROR_MESSAGES.includes(errorMessage) && (
            <div class={NOTICE_STYLES}>{errorMessage}</div>
          )}
          <form method="POST" class="space-y-4">
            <input
              type="text"
              value={getUserDisplayName(props.data.user)}
              placeholder="Display name"
              name="display_name"
              required
              class={INPUT_STYLES}
            />
            <button type="submit" class={`${BUTTON_STYLES} w-full`}>
              Update
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
