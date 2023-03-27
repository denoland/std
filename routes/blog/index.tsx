import { Handlers } from "$fresh/server.ts";
import { PageProps } from "$fresh/server.ts";
import Header from "../../components/Header.tsx";
import Nav from "../../components/Nav.tsx";
import PostCard from "../../components/PostCard.tsx";
import { getPosts, Post } from "../../utils/posts.ts";

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
