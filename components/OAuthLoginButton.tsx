// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Provider } from "@supabase/supabase-js";
import type { ComponentChild } from "preact";

interface OAuthLoginButtonProps {
  provider: Provider;
  children: ComponentChild;
}

export default function OAuthLoginButton(props: OAuthLoginButtonProps) {
  return (
    <form action="/login/oauth" method="POST">
      <input type="hidden" value={props.provider} name="provider" />
      <button
        type="submit"
        class="px-4 py-2 w-full bg-white text-black text-lg rounded-lg border-2 border-black disabled:(opacity-50 cursor-not-allowed)"
        /** @todo disabled for preview deployment */
        disabled
      >
        {props.children}
      </button>
    </form>
  );
}
