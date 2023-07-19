// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { Handlers } from "$fresh/server.ts";
import { PageProps } from "$fresh/server.ts";
import { getPosts, Post } from "@/utils/posts.ts";
import type { State } from "@/routes/_middleware.ts";
import Head from "@/components/Head.tsx";

interface BlogPageData extends State {
  posts: Post[];
}

export const handler: Handlers<BlogPageData, State> = {
  async GET(_req, ctx) {
    const posts = await getPosts();

    return ctx.render({ ...ctx.state, posts });
  },
};

function PostCard(props: Post) {
  return (
    <div class="py-8 border(t gray-200)">
      <a class="sm:col-span-2" href={`/blog/${props.slug}`}>
        <h2 class="text-3xl font-bold">
          {props.title}
        </h2>
        {props.publishedAt.toString() !== "Invalid Date" && (
          <time class="text-gray-500">
            {new Date(props.publishedAt).toLocaleDateString("en-US", {
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

export default function BlogPage(props: PageProps<BlogPageData>) {
  return (
    <>
      <Head title="Blog" href={props.url.href} />
      <main class="p-4 flex-1">
        <h1 class="text-5xl font-bold">Blog</h1>
        <div class="mt-8">
          {props.data.posts.map((post) => <PostCard {...post} />)}
        </div>
      </main>
    </>
  );
}
