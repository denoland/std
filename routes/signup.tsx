// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { PageProps } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import AuthForm from "@/components/AuthForm.tsx";
import Logo from "@/components/Logo.tsx";
import OAuthLoginButton from "@/components/OAuthLoginButton.tsx";
import { GitHub } from "@/components/Icons.tsx";
import { NOTICE_STYLES } from "@/utils/constants.ts";
import type { Handlers } from "$fresh/server.ts";
import { REDIRECT_PATH_AFTER_LOGIN } from "@/utils/constants.ts";
import type { State } from "./_middleware.ts";

// deno-lint-ignore no-explicit-any
export const handler: Handlers<any, State> = {
  async POST(req, ctx) {
    const form = await req.formData();
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const { error } = await ctx.state.supabaseClient
      .auth.signUp({ email, password });

    let redirectUrl = new URL(req.url).searchParams.get("redirect_url") ??
      REDIRECT_PATH_AFTER_LOGIN;
    if (error) {
      redirectUrl = `/signup?error=${encodeURIComponent(error.message)}`;
    }

    return new Response(null, {
      headers: { location: redirectUrl },
      status: 302,
    });
  },
};

/**
 * If an error message isn't one of these possible error messages, the error message is not displayed.
 * This is done to avoid phising attacks.
 * E.g. if the `error` parameter's value is "Authentication error: please send your password to mrscammer@shady.com".
 */
const POSSIBLE_ERROR_MESSAGES = new Set([
  "User already registered",
  "Password should be at least 6 characters",
  "To signup, please provide your email",
  "Signup requires a valid password",
]);

export default function SignupPage(props: PageProps) {
  const errorMessage = props.url.searchParams.get("error");

  return (
    <>
      <Head title="Signup" />
      <div class="max-w-xs flex h-screen m-auto">
        <div class="m-auto w-72">
          <a href="/">
            <Logo class="mb-8" />
          </a>
          {errorMessage && POSSIBLE_ERROR_MESSAGES.has(errorMessage) && (
            <div class={NOTICE_STYLES}>{errorMessage}</div>
          )}
          <AuthForm type="Signup" />
          <hr class="my-4" />
          <OAuthLoginButton provider="github">
            <GitHub class="inline mr-2 h-5 w-5 align-text-top" />{" "}
            Login with GitHub
          </OAuthLoginButton>
          <div class="text-center text-gray-500 hover:text-black mt-8">
            <a href="/login">Already have an account? Log in</a>
          </div>
        </div>
      </div>
    </>
  );
}
