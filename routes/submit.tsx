// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import Layout from "@/components/Layout.tsx";
import { BUTTON_STYLES, INPUT_STYLES } from "@/utils/constants.ts";
import type { SupabaseClient } from "@/utils/supabase.ts";
import type { Database } from "@/utils/supabase_types.ts";
import type { State } from "@/routes/_middleware.ts";

export async function createItem(
  supabaseClient: SupabaseClient,
  item: Database["public"]["Tables"]["items"]["Insert"],
) {
  return await supabaseClient
    .from("items")
    .insert(item)
    .throwOnError();
}

export const handler: Handlers<State, State> = {
  async GET(req, ctx) {
    if (!ctx.state.session) {
      return new Response(null, {
        headers: {
          location: `/login?redirect_url=${encodeURIComponent(req.url)}`,
        },
        /** @todo Confirm whether this HTTP redirect status code is correct */
        status: 302,
      });
    }

    return await ctx.render(ctx.state);
  },
  async POST(req, ctx) {
    const form = await req.formData();
    const item: Database["public"]["Tables"]["items"]["Insert"] = {
      title: form.get("title") as string,
      url: form.get("url") as string,
    };

    // @ts-ignore Fix at some point
    await createItem(ctx.state.supabaseClient, item);

    return ctx.render();
  },
};

function Form() {
  return (
    <form class=" space-y-2" method="post">
      <input
        class={INPUT_STYLES}
        type="text"
        name="title"
        required
        placeholder="Title"
      />
      <input
        class={INPUT_STYLES}
        type="url"
        name="url"
        required
        placeholder="URL"
      />
      <button class={`${BUTTON_STYLES} block w-full`} type="submit">
        Submit
      </button>
    </form>
  );
}

export default function SubmitPage(props: PageProps<State>) {
  return (
    <>
      <Head title="Submit" />
      <Layout isLoggedIn={props.data.isLoggedIn}>
        <div class="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
          <h1 class="text-center text-2xl font-bold">Share your project</h1>
          <Form />
        </div>
      </Layout>
    </>
  );
}
