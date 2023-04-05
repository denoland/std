// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { useEffect } from "preact/hooks";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-shared";
import { AUTHENTICATED_REDIRECT_PATH } from "@/constants.ts";

export default function AuthFragmentCatcher(
  props: Parameters<typeof createBrowserSupabaseClient>[0],
) {
  useEffect(() => {
    const supabase = createBrowserSupabaseClient(props);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        window.location.href = AUTHENTICATED_REDIRECT_PATH;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <span></span>;
}
