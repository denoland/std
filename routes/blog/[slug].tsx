// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { Handlers, PageProps } from "$fresh/server.ts";
import { CSS, render } from "$gfm";
import { Head } from "$fresh/runtime.ts";
import { getPost, Post } from "@/utils/posts.ts";
import Meta from "@/components/Meta.tsx";
import Layout from "@/components/Layout.tsx";
import { SITE_WIDTH_STYLES } from "@/utils/constants.ts";
import type { State } from "@/routes/_middleware.ts";

interface BlogPostPageData extends State {
  post: Post;
}

export const handler: Handlers<BlogPostPageData, State> = {
  async GET(_req, ctx) {
    const post = await getPost(ctx.params.slug);
    if (post === null) return ctx.renderNotFound();
    return ctx.render({ ...ctx.state, post });
  },
};

export default function PostPage(props: PageProps<BlogPostPageData>) {
  const { post } = props.data;

  const date = new Date(post.publishedAt).toLocaleDateString("en-us", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Head>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <Meta
          title={post.title}
          description={post.summary}
          href={props.url.href}
        />
      </Head>
      <Layout isLoggedIn={props.data.isLoggedIn}>
        <main class={`${SITE_WIDTH_STYLES} px-8 pt-16 flex-1`}>
          <h1 class="text-5xl font-bold">{post.title}</h1>
          <time class="text-gray-500">
            {date}
          </time>
          <div
            class="mt-8 markdown-body"
            dangerouslySetInnerHTML={{ __html: render(post.content) }}
          />
        </main>
      </Layout>
    </>
  );
}
