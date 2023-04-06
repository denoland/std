// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import AuthFragmentCatcher from "@/islands/AuthFragmentCatcher.tsx";

export default function OAuthSuccessPage() {
  return (
    <AuthFragmentCatcher
      supabaseUrl={Deno.env.get("SUPABASE_URL")!}
      supabaseKey={Deno.env.get("SUPABASE_ANON_KEY")!}
    />
  );
}
