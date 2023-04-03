import Button from "@/components/Button.tsx";
import type { Provider } from "@supabase/supabase-js";
import type { GitHub } from "./Icons.tsx";

function capitalize(value: string) {
  return value[0].toUpperCase() + value.slice(1);
}

interface OAuthLoginButtonProps {
  provider: Provider;
  icon: typeof GitHub;
}

export default function OAuthLoginButton(props: OAuthLoginButtonProps) {
  return (
    <form action="/api/oauth" method="POST">
      <input type="hidden" value={props.provider} name="provider" />
      <Button
        type="submit"
        class="w-full bg-white! text-black border-black border-2 align-middle"
      >
        <props.icon class="inline mr-2" />Log in with{" "}
        {capitalize(props.provider)}
      </Button>
    </form>
  );
}
