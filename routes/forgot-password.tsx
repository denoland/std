// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import Logo from "@/components/Logo.tsx";
import Head from "@/components/Head.tsx";
import {
  BUTTON_STYLES,
  INPUT_STYLES,
  NOTICE_STYLES,
} from "@/utils/constants.ts";
import type { State } from "./_middleware.ts";

// deno-lint-ignore no-explicit-any
export const handler: Handlers<any, State> = {
  async POST(req, ctx) {
    const form = await req.formData();
    const email = form.get("email") as string;

    const redirectTo = new URL(req.url).origin + "/login/success?redirect_to=" +
      encodeURIComponent("/account/reset-password");
    const { error } = await ctx.state.supabaseClient.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );

    if (error) {
      return new Response(null, {
        headers: {
          location: `/forgot-password?error=${
            encodeURIComponent(error.message)
          }`,
        },
        status: 302,
      });
    }

    return new Response(null, {
      headers: { location: "/forgot-password?success=1" },
      status: 302,
    });
  },
};

export default function ForgotPassword(props: PageProps) {
  const successMessage = props.url.searchParams.get("success");
  const errorMessage = props.url.searchParams.get("error");

  return (
    <>
      <Head title="Forgot password" href={props.url.href} />
      <div class="max-w-xs flex h-screen m-auto">
        <div class="m-auto w-72">
          <a href="/">
            <Logo class="mb-8" />
          </a>
          <h1 class="text-center my-8 text-2xl font-bold">Forgot password</h1>
          {successMessage && (
            <div class={NOTICE_STYLES}>
              Reset password link sent to email
            </div>
          )}
          {errorMessage && <div class={NOTICE_STYLES}>{errorMessage}</div>}
          <form method="POST" class="space-y-4">
            <input
              placeholder="Email"
              name="email"
              type="email"
              required
              class={`${INPUT_STYLES} w-full`}
            />
            <button type="submit" class={`${BUTTON_STYLES} w-full`}>
              Send
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
