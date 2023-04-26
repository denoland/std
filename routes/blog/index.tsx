// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { Handlers } from "$fresh/server.ts";
import { PageProps } from "$fresh/server.ts";
import PostCard from "@/components/PostCard.tsx";
import { getPosts, Post } from "@/utils/posts.ts";
import { SITE_NAME } from "@/utils/constants.ts";
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

export default function BlogPage(props: PageProps<BlogPageData>) {
  return (
    <>
      <Head
        title={`Blog | ${SITE_NAME}`}
        description="This is the blog for Deno SaaSKit"
        href={props.url.href}
      />
      <Layout isLoggedIn={props.data.isLoggedIn}>
        <main class={`${SITE_WIDTH_STYLES} px-8 pt-16 flex-1`}>
          <h1 class="text-5xl font-bold">Blog</h1>
          <div class="mt-8">
            {props.data.posts.map((post) => <PostCard post={post} />)}
          </div>
        </main>
      </Layout>
    </>
  );
}
