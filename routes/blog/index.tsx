// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { defineRoute } from "$fresh/server.ts";
import { getPosts, type Post } from "@/utils/posts.ts";
import Head from "@/components/Head.tsx";

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

export default defineRoute(async (_req, ctx) => {
  const posts = await getPosts();

  return (
    <>
      <Head title="Blog" href={ctx.url.href} />
      <main class="p-4 flex-1">
        <h1 class="heading-with-margin-styles">Blog</h1>
        <div class="divide-y">
          {posts.map((post) => <PostCard {...post} />)}
        </div>
      </main>
    </>
  );
});
