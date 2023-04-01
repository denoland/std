import { getPost, getPosts } from "./posts.ts";

import { assert, assertEquals } from "std/testing/asserts.ts";

Deno.test("get Post", async () => {
  const post = await getPost("first-post");
  assert(post);
  assertEquals(post.title, "This is my first blog post!");
});

Deno.test("get Post non existent", async () => {
  const post = await getPost("third-post");
  assertEquals(post, null);
});

Deno.test("get Posts from data directory", async () => {
  const posts = await getPosts();
  assert(posts);
  assertEquals(posts.length, 2);
});
