// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Provider } from "@supabase/supabase-js";
import type { ComponentChild } from "preact";
import { BASE_BUTTON_STYLES } from "@/constants.ts";

interface OAuthLoginButtonProps {
  provider: Provider;
  children: ComponentChild;
}

export default function OAuthLoginButton(props: OAuthLoginButtonProps) {
  return (
    <form action="/api/oauth" method="POST">
      <input type="hidden" value={props.provider} name="provider" />
      <button
        type="submit"
        class={`w-full bg-white !text-black border-black border-2 align-middle ${BASE_BUTTON_STYLES}`}
      >
        {props.children}
      </button>
    </form>
  );
}
