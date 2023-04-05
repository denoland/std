import Button from "@/components/Button.tsx";
import type { Provider } from "@supabase/supabase-js";
import type { ComponentChild } from "preact";

interface OAuthLoginButtonProps {
  provider: Provider;
  children: ComponentChild;
}

export default function OAuthLoginButton(props: OAuthLoginButtonProps) {
  return (
    <form action="/api/oauth" method="POST">
      <input type="hidden" value={props.provider} name="provider" />
      <Button
        type="submit"
        class="w-full bg-white! text-black border-black border-2 align-middle"
      >
        {props.children}
      </Button>
    </form>
  );
}
