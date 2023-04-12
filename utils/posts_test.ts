// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { getPost, getPosts } from "./posts.ts";

import { assert, assertEquals } from "std/testing/asserts.ts";

Deno.test("[blog] getPost()", async () => {
  const post = await getPost("first-post");
  assert(post);
  assertEquals(post.title, "This is my first blog post!");
});

Deno.test("[blog] getPost() for non-existent post", async () => {
  const post = await getPost("third-post");
  assertEquals(post, null);
});

Deno.test("[blog] getPosts() from data directory", async () => {
  const posts = await getPosts();
  assert(posts);
  assertEquals(posts.length, 2);
});
