// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import Layout from "@/components/Layout.tsx";
import { BUTTON_STYLES, INPUT_STYLES } from "@/utils/constants.ts";
import type { State } from "@/routes/_middleware.ts";
import { createItem, getUserBySessionId } from "@/utils/db.ts";
import { redirect } from "@/utils/http.ts";

export const handler: Handlers<State, State> = {
  GET(_req, ctx) {
    return ctx.state.sessionId ? ctx.render(ctx.state) : redirect("/login");
  },
  async POST(req, ctx) {
    if (!ctx.state.sessionId) {
      await req.body?.cancel();
      return new Response(null, { status: 401 });
    }

    const form = await req.formData();
    const title = form.get("title");
    const url = form.get("url");

    if (typeof title !== "string" || typeof url !== "string") {
      return new Response(null, { status: 400 });
    }

    try {
      // Throws if an invalid URL
      new URL(url);
    } catch {
      return new Response(null, { status: 400 });
    }

    const user = await getUserBySessionId(ctx.state.sessionId);

    if (!user) return new Response(null, { status: 400 });

    const item = await createItem({
      userId: user.id,
      title,
      url,
    });

    return redirect(`/item/${item!.id}`);
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
      <Head title="Submit" href={props.url.href} />
      <Layout session={props.data.sessionId}>
        <div class="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
          <h1 class="text-center text-2xl font-bold">Share your project</h1>
          <Form />
        </div>
      </Layout>
    </>
  );
}
