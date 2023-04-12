// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { BASE_BUTTON_STYLES, BASE_INPUT_STYLES } from "@/constants.ts";

interface AuthFormProps {
  type: "Login" | "Signup";
}

export default function AuthForm({ type }: AuthFormProps) {
  return (
    <form method="POST" class="space-y-4" action={`/api/${type.toLowerCase()}`}>
      <input
        placeholder="Email"
        name="email"
        type="email"
        required
        class={`${BASE_INPUT_STYLES} w-full`}
      />
      <input
        placeholder="Password"
        name="password"
        type="password"
        required
        class={`${BASE_INPUT_STYLES} w-full`}
      />
      <button type="submit" class={`${BASE_BUTTON_STYLES} w-full`}>
        {type}
      </button>
    </form>
  );
}
