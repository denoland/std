// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { useEffect } from "preact/hooks";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-shared";
import { REDIRECT_PATH_AFTER_LOGIN } from "@/utils/constants.ts";

interface AuthFragmentCatcherProps {
  supabaseUrl: string;
  supabaseKey: string;
  redirectTo?: string;
}

export default function AuthFragmentCatcher(props: AuthFragmentCatcherProps) {
  useEffect(() => {
    const supabase = createBrowserSupabaseClient(props);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        window.location.href = props.redirectTo || REDIRECT_PATH_AFTER_LOGIN;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <span></span>;
}
