// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { PageProps } from "$fresh/server.ts";
import AuthFragmentCatcher from "@/islands/AuthFragmentCatcher.tsx";

export default function OAuthSuccessPage(props: PageProps) {
  return (
    <AuthFragmentCatcher
      supabaseUrl={Deno.env.get("SUPABASE_API_URL")!}
      supabaseKey={Deno.env.get("SUPABASE_ANON_KEY")!}
      redirectTo={props.url.searchParams.get("redirect_to") || undefined}
    />
  );
}
