import type { Handlers } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import Layout from "@/components/Layout.tsx";
import { BASE_BUTTON_STYLES, BASE_INPUT_STYLES } from "@/utils/constants.ts";
import { ensureLoggedInHandler } from "@/utils/auth.ts";
import type { SupabaseClient } from "@/utils/supabase.ts";
import type { Database } from "@/utils/supabase_types.ts";

export async function createItem(
  supabaseClient: SupabaseClient,
  item: Database["public"]["Tables"]["items"]["Insert"],
) {
  return await supabaseClient
    .from("items")
    .insert(item)
    .throwOnError();
}

export const handler: Handlers = {
  GET: ensureLoggedInHandler,
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
        class={BASE_INPUT_STYLES}
        type="text"
        name="title"
        required
        placeholder="Title"
      />
      <input
        class={BASE_INPUT_STYLES}
        type="url"
        name="url"
        required
        placeholder="URL"
      />
      <button class={`${BASE_BUTTON_STYLES} block w-full`} type="submit">
        Submit
      </button>
    </form>
  );
}

export default function SubmitPage() {
  return (
    <>
      <Head title="Submit" />
      <Layout>
        <div class="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
          <h1 class="text-center text-2xl font-bold">Share your project</h1>
          <Form />
        </div>
      </Layout>
    </>
  );
}
