// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { Handlers } from "$fresh/server.ts";
import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Header from "@/components/Header.tsx";
import Nav from "@/components/Nav.tsx";
import PostCard from "@/components/PostCard.tsx";
import { getPosts, Post } from "@/utils/posts.ts";
import { SITE_NAME } from "@/constants.ts";
import Footer from "@/components/Footer.tsx";

export const BlogHeaderNavItems = [
  {
    href: "/blog",
    inner: "Blog",
  },
];

export const BlogFooterNavItems = [
  {
    inner: "Features",
    href: "/#features",
  },
  {
    inner: "Pricing",
    href: "/#pricing",
  },
  {
    inner: "Testimonial",
    href: "/#testimonial",
  },
];

export default function BlogIndexPage(props: PageProps<Post[]>) {
  const posts = props.data;
  return (
    <>
      <Head>
        <title>Blog</title>
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:locale" content="en" />
        <meta property="og:title" content={`Blog | ${SITE_NAME}`} />
        <meta
          property="og:description"
          content="This is the blog for Deno SaaSKit"
        />
        <meta property="og:url" content={props.url.origin} />
        <meta name="twitter:title" content={`Blog | ${SITE_NAME}`} />
        <meta
          name="twitter:description"
          content="This is the blog for Deno SaaSKit"
        />
        <meta name="description" content="This is the blog for Deno SaaSKit" />
        <meta itemProp="name" content={`Blog | ${SITE_NAME}`} />
        <meta
          itemProp="description"
          content="This is the blog for Deno SaaSKit"
        />
      </Head>
      <Header>
        <Nav items={BlogHeaderNavItems} />
      </Header>
      <main class="max-w-screen-md px-4 pt-16 mx-auto">
        <h1 class="text-5xl font-bold">Blog</h1>
        <div class="mt-8">
          {posts.map((post) => <PostCard post={post} />)}
        </div>
      </main>
      <Footer>
        <Nav items={BlogFooterNavItems} />
      </Footer>
    </>
  );
}

export const handler: Handlers<Post[]> = {
  async GET(_req, ctx) {
    const posts = await getPosts();
    return ctx.render(posts);
  },
};
