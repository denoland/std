// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { getPost, getPosts } from "./posts.ts";

import { assert, assertEquals } from "std/testing/asserts.ts";

Deno.test("[blog] getPost()", async () => {
  const post = await getPost("first-post");
  assert(post);
  assertEquals(post.publishedAt, new Date("2022-11-04T15:00:00.000Z"));
  assertEquals(post.summary, "This is an excerpt of my first blog post.");
  assertEquals(post.title, "This is my first blog post!");
});

Deno.test("[blog] getPost() with missing frontmatter attributes", async () => {
  const post = await getPost("second-post");
  assert(post);
  assertEquals(post.publishedAt, new Date("2022-11-04T15:00:00.000Z"));
  assertEquals(
    post.summary,
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
  );
  assertEquals(post.title, "Second post");
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
