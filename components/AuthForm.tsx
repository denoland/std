// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { BUTTON_STYLES, INPUT_STYLES } from "@/utils/constants.ts";

interface AuthFormProps {
  type: "Login" | "Signup";
}

export default function AuthForm({ type }: AuthFormProps) {
  return (
    <form method="POST" class="space-y-4" action={`/${type.toLowerCase()}`}>
      <input
        placeholder="Email"
        name="email"
        type="email"
        required
        class={`${INPUT_STYLES} w-full`}
      />
      <input
        placeholder="Password"
        name="password"
        type="password"
        required
        class={`${INPUT_STYLES} w-full`}
      />
      <button type="submit" class={`${BUTTON_STYLES} w-full`}>
        {type}
      </button>
    </form>
  );
}
