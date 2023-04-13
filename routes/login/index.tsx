// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import Logo from "@/components/Logo.tsx";
import Head from "@/components/Head.tsx";
import AuthForm from "@/components/AuthForm.tsx";
import OAuthLoginButton from "@/components/OAuthLoginButton.tsx";
import { GitHub } from "@/components/Icons.tsx";
import { BASE_NOTICE_STYLES } from "@/constants.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";
import { AUTHENTICATED_REDIRECT_PATH } from "@/constants.ts";

export const handler: Handlers = {
  /**
   * Redirects the client to the authenticated redirect path if already login.
   * If not logged in, it continues to rendering the login page.
   */
  async GET(request, ctx) {
    const headers = new Headers();
    const supabaseClient = createSupabaseClient(request.headers, headers);

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
      return new Response(null, {
        status: 302,
        headers: {
          location: AUTHENTICATED_REDIRECT_PATH,
        },
      });
    }

    return ctx.render();
  },
};

/**
 * If an error message isn't one of these possible error messages, the error message is not displayed.
 * This is done to avoid phising attacks.
 * E.g. if the `error` parameter's value is "Authentication error: please send your password to mrscammer@shady.com".
 */
const POSSIBLE_ERROR_MESSAGES = new Set([
  "Invalid login credentials",
]);

export default function LoginPage(props: PageProps) {
  const errorMessage = props.url.searchParams.get("error");

  return (
    <>
      <Head title="Login" />
      <div class="max-w-xs flex h-screen m-auto">
        <div class="m-auto w-72">
          <a href="/">
            <Logo class="mb-8" />
          </a>
          {errorMessage && POSSIBLE_ERROR_MESSAGES.has(errorMessage) && (
            <div class={BASE_NOTICE_STYLES}>{errorMessage}</div>
          )}
          <AuthForm type="Login" />
          <hr class="my-4" />
          <OAuthLoginButton provider="github">
            <GitHub class="inline mr-2 h-5 w-5 align-text-top" />{" "}
            Login with GitHub
          </OAuthLoginButton>
          <div class="text-center text-gray-500 hover:text-black mt-8">
            <a href="/signup">Don't have an account? Sign up</a>
          </div>
        </div>
      </div>
    </>
  );
}
