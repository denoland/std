// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { BUTTON_STYLES, INPUT_STYLES } from "@/utils/constants.ts";
import type { State } from "@/routes/_middleware.ts";
import {
  createItem,
  getUserBySession,
  type Item,
  newItemProps,
} from "@/utils/db.ts";
import { redirect } from "@/utils/redirect.ts";
import { redirectToLogin } from "@/utils/redirect.ts";

export const handler: Handlers<State, State> = {
  GET(req, ctx) {
    ctx.state.title = "Submit";

    return ctx.state.sessionId
      ? ctx.render(ctx.state)
      : redirectToLogin(req.url);
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

    const user = await getUserBySession(ctx.state.sessionId);

    if (!user) return new Response(null, { status: 400 });

    const item: Item = {
      userId: user.id,
      title,
      url,
      ...newItemProps(),
    };
    await createItem(item);

    return redirect(`/item/${item!.id}`);
  },
};

export default function SubmitPage() {
  return (
    <main class="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
      <h1 class="text-center text-2xl font-bold">
        Share your project
      </h1>
      <form class="space-y-2" method="post">
        <input
          class={`${INPUT_STYLES} w-full`}
          type="text"
          name="title"
          required
          placeholder="Title"
        />
        <input
          class={`${INPUT_STYLES} w-full`}
          type="url"
          name="url"
          required
          placeholder="URL"
        />
        <div class="w-full rounded-lg bg-gradient-to-tr from-secondary to-primary p-px">
          <button class="w-full text-white text-left rounded-[7px] transition duration-300 px-4 py-2 block hover:(bg-white text-black dark:(bg-gray-900 !text-white))">
            Submit
          </button>
        </div>
      </form>
    </main>
  );
}
