// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import { CSS, render } from "$gfm";
import { getPost } from "@/utils/posts.ts";
import Head from "@/components/Head.tsx";
import Share from "@/components/Share.tsx";

export default async function BlogPostPage(_req: Request, ctx: RouteContext) {
  const post = await getPost(ctx.params.slug);
  if (post === null) return await ctx.renderNotFound();

  const date = post.publishedAt.toString() !== "Invalid Date" &&
    post.publishedAt.toLocaleDateString("en-US", {
      dateStyle: "long",
    });

  return (
    <>
      <Head title={post.title} href={ctx.url.href}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </Head>
      <main class="p-4 flex-1">
        <h1 class="text-4xl font-bold">{post.title}</h1>
        {date && (
          <time
            dateTime={post.publishedAt.toISOString()}
            class="text-gray-500"
          >
            {date}
          </time>
        )}
        <Share url={ctx.url} title={post.title} />
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
