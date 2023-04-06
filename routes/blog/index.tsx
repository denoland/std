import { Handlers } from "$fresh/server.ts";
import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Header from "../../components/Header.tsx";
import Nav from "../../components/Nav.tsx";
import PostCard from "../../components/PostCard.tsx";
import { getPosts, Post } from "../../utils/posts.ts";
import { SITE_NAME } from "../../constants.ts";

export const BlogHeaderNavItems = [
  {
    href: "/blog",
    inner: "Blog",
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
        <meta property="og:title" content="Blog" />
        <meta property="og:url" content={props.url.origin} />
        <meta name="twitter:title" content="Blog" />
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
    </>
  );
}

export const handler: Handlers<Post[]> = {
  async GET(_req, ctx) {
    const posts = await getPosts();
    return ctx.render(posts);
  },
};
