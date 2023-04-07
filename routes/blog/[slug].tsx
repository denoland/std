// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { Handlers, PageProps } from "$fresh/server.ts";
import { CSS, render } from "$gfm";
import { Head } from "$fresh/runtime.ts";
import { getPost, Post } from "@/utils/posts.ts";
import Nav from "@/components/Nav.tsx";
import Header from "@/components/Header.tsx";
import { SITE_NAME } from "@/constants.ts";
import {
  BlogFooterNavItems,
  BlogHeaderNavItems,
} from "@/routes/blog/index.tsx";
import Footer from "@/components/Footer.tsx";

export const handler: Handlers<Post> = {
  async GET(_req, ctx) {
    const post = await getPost(ctx.params.slug);
    if (post === null) return ctx.renderNotFound();
    return ctx.render(post);
  },
};

export default function PostPage(props: PageProps<Post>) {
  const post = props.data;

  const date = new Date(post.publishedAt).toLocaleDateString("en-us", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Head>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <title>{post.title}</title>
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:locale" content="en" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.summary} />
        <meta property="og:url" content={props.url.origin} />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.summary} />
        <meta name="description" content={post.summary} />
        <meta itemProp="name" content={post.title} />
        <meta itemProp="description" content={post.summary} />
      </Head>
      <Header>
        <Nav items={BlogHeaderNavItems} />
      </Header>
      <main class="max-w-screen-md px-4 py-16 mx-auto">
        <h1 class="text-5xl font-bold">{post.title}</h1>
        <time class="text-gray-500">
          {date}
        </time>
        <div
          class="mt-8 markdown-body"
          dangerouslySetInnerHTML={{ __html: render(post.content) }}
        />
      </main>
      <Footer>
        <Nav items={BlogFooterNavItems} />
      </Footer>
    </>
  );
}
