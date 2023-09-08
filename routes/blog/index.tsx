// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import { getPosts, type Post } from "@/utils/posts.ts";
import Head from "@/components/Head.tsx";
import { HEADING_WITH_MARGIN_STYLES } from "@/utils/constants.ts";

function PostCard(props: Post) {
  return (
    <div class="py-8">
      <a class="sm:col-span-2" href={`/blog/${props.slug}`}>
        <h2 class="text-2xl font-bold">
          {props.title}
        </h2>
        {props.publishedAt.toString() !== "Invalid Date" && (
          <time
            dateTime={props.publishedAt.toISOString()}
            class="text-gray-500"
          >
            {props.publishedAt.toLocaleDateString("en-US", {
              dateStyle: "long",
            })}
          </time>
        )}
        <div class="mt-4">
          {props.summary}
        </div>
      </a>
    </div>
  );
}

export default async function BlogPage(_req: Request, ctx: RouteContext) {
  const posts = await getPosts();

  return (
    <>
      <Head title="Blog" href={ctx.url.href} />
      <main class="p-4 flex-1">
        <h1 class={HEADING_WITH_MARGIN_STYLES}>Blog</h1>
        <div class="divide-y">
          {posts.map((post) => <PostCard {...post} />)}
        </div>
      </main>
    </>
  );
}
