// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { Handlers } from "$fresh/server.ts";
import { PageProps } from "$fresh/server.ts";
import { getPosts, Post } from "@/utils/posts.ts";
import Head from "@/components/Head.tsx";
import Layout from "@/components/Layout.tsx";
import { SITE_WIDTH_STYLES } from "@/utils/constants.ts";
import type { State } from "@/routes/_middleware.ts";

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
        <h3 class="text(3xl gray-900) font-bold">
          {props.title}
        </h3>
        {props.publishedAt.toString() !== "Invalid Date" && (
          <time class="text-gray-500">
            {new Date(props.publishedAt).toLocaleDateString("en-US", {
              dateStyle: "long",
            })}
          </time>
        )}
        <div class="mt-4 text-gray-900">
          {props.summary}
        </div>
      </a>
    </div>
  );
}

export default function BlogPage(props: PageProps<BlogPageData>) {
  return (
    <>
      <Head
        title="Blog"
        description="This is the blog for Deno SaaSKit"
        href={props.url.href}
      />
      <Layout session={props.data.sessionId}>
        <main class={`${SITE_WIDTH_STYLES} px-4 pt-16 flex-1`}>
          <h1 class="text-5xl font-bold">Blog</h1>
          <div class="mt-8">
            {props.data.posts.map((post) => <PostCard {...post} />)}
          </div>
        </main>
      </Layout>
    </>
  );
}
