// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import Head from "@/components/Head.tsx";
import IconCheckCircle from "tabler_icons_tsx/circle-check.tsx";
import IconCircleX from "tabler_icons_tsx/circle-x.tsx";
import { defineRoute, Handlers } from "$fresh/server.ts";
import { createItem } from "@/utils/db.ts";
import { redirect } from "@/utils/http.ts";
import {
  assertSignedIn,
  type SignedInState,
  State,
} from "@/plugins/session.ts";
import { ulid } from "std/ulid/mod.ts";
import IconInfo from "tabler_icons_tsx/info-circle.tsx";

const SUBMIT_STYLES =
  "w-full text-white text-center rounded-[7px] transition duration-300 px-4 py-2 block hover:bg-white hover:text-black hover:dark:bg-gray-900 hover:dark:!text-white";

export const handler: Handlers<undefined, SignedInState> = {
  async POST(req, ctx) {
    assertSignedIn(ctx);

    const form = await req.formData();
    const title = form.get("title");
    const url = form.get("url");

    if (
      typeof url !== "string" || !URL.canParse(url) ||
      typeof title !== "string" || title === ""
    ) {
      return redirect("/submit?error");
    }

    await createItem({
      id: ulid(),
      userLogin: ctx.state.sessionUser.login,
      title,
      url,
      score: 0,
    });
    return redirect("/");
  },
};

export default defineRoute<State>((_req, ctx) => {
  return (
    <>
      <Head title="Submit" href={ctx.url.href} />
      <main class="flex-1 flex flex-col justify-center mx-auto w-full space-y-16 p-4 max-w-6xl">
        <div class="text-center">
          <h1 class="heading-styles">
            Share your project
          </h1>
          <p class="text-gray-500">
            Let the community know about your Deno-related blog post, video or
            module!
          </p>
        </div>
        <div class="flex flex-col md:flex-row gap-8 md:gap-16 md:items-center">
          <div class="flex-1 space-y-6">
            <p>
              <IconCircleX class="inline-block mr-2" />
              <strong>Don't</strong> post duplicate content
            </p>
            <p>
              <IconCircleX class="inline-block mr-2" />
              <strong>Don't</strong> share dummy or test posts
            </p>
            <div>
              <IconCheckCircle class="inline-block mr-2" />
              <strong>Do</strong> include a description with your title.

              <div class="text-sm text-gray-500">
                E.g. “Deno Hunt: the best place to share your Deno project”
              </div>
            </div>
            <p>
            </p>
          </div>
          <form
            class="flex-1 flex flex-col justify-center"
            method="post"
          >
            <div>
              <label
                htmlFor="submit_title"
                class="block text-sm font-medium leading-6 text-gray-900"
              >
                Title
              </label>
              <input
                id="submit_title"
                class="input-styles w-full mt-2"
                type="text"
                name="title"
                required
                placeholder="Deno Hunt: the best place to share your Deno project"
                disabled={!ctx.state.sessionUser}
              />
            </div>

            <div class="mt-4">
              <label
                htmlFor="submit_title"
                class="block text-sm font-medium leading-6 text-gray-900"
              >
                URL
              </label>
              <input
                class="input-styles w-full mt-2"
                type="url"
                name="url"
                required
                placeholder="https://my-awesome-project.com"
                disabled={!ctx.state.sessionUser}
              />
            </div>
            {ctx.url.searchParams.has("error") && (
              <div class="w-full text-red-500 mt-4">
                <IconInfo class="inline-block" />{" "}
                Title and valid URL are required
              </div>
            )}
            <div class="w-full rounded-lg bg-gradient-to-tr from-secondary to-primary p-px mt-8">
              {!ctx.state.sessionUser
                ? (
                  <a href="/signin" class={SUBMIT_STYLES}>
                    Sign in to submit &#8250;
                  </a>
                )
                : (
                  <button class={SUBMIT_STYLES}>
                    Submit
                  </button>
                )}
            </div>
          </form>
        </div>
      </main>
    </>
  );
});
