// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { Handlers, PageProps } from "$fresh/server.ts";
import { CSS, render } from "$gfm";
import { getPost, Post } from "@/utils/posts.ts";
import type { State } from "@/routes/_middleware.ts";
import { Head } from "$fresh/runtime.ts";

interface BlogPostPageData extends State {
  post: Post;
}

export const handler: Handlers<BlogPostPageData, State> = {
  async GET(_req, ctx) {
    const post = await getPost(ctx.params.slug);
    if (post === null) return ctx.renderNotFound();

    ctx.state.title = post.title;
    ctx.state.description = post.summary;

    return ctx.render({ ...ctx.state, post });
  },
};

export default function PostPage(props: PageProps<BlogPostPageData>) {
  const { post } = props.data;
  const date = post.publishedAt.toString() !== "Invalid Date" &&
    new Date(post.publishedAt).toLocaleDateString("en-US", {
      dateStyle: "long",
    });

  return (
    <>
      <Head>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </Head>
      <main class="p-4 flex-1">
        <h1 class="text-5xl font-bold">{post.title}</h1>
        {date && (
          <time class="text-gray-500">
            {date}
          </time>
        )}
        <div
          class="mt-8 markdown-body !bg-transparent !dark:text-white"
          data-color-mode="auto"
          data-light-theme="light"
          data-dark-theme="dark"
          dangerouslySetInnerHTML={{ __html: render(post.content) }}
        />
      </main>
    </>
  );
}
