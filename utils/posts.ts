// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import { extract } from "std/front_matter/yaml.ts";
import { join } from "std/path/join.ts";

/**
 * This code is based on the
 * {@link https://deno.com/blog/build-a-blog-with-fresh|How to Build a Blog with Fresh}
 * blog post.
 */

export interface Post {
  slug: string;
  title: string;
  publishedAt: Date;
  content: string;
  summary: string;
}

/**
 * Returns a {@linkcode Post} object of by reading and parsing a file with the
 * given slug in the `./posts` folder. Returns `null` if the given file is
 * not a readable or parsable file.
 *
 * @see {@link https://deno.land/api?s=Deno.readTextFile}
 *
 * @example
 * ```ts
 * import { getPost } from "@/utils/posts.ts";
 *
 * const post = await getPost("first-post")!;
 *
 * post?.title; // Returns "This is my first blog post!"
 * post?.publishedAt; // Returns 2022-11-04T15:00:00.000Z
 * post?.slug; // Returns "This is an excerpt of my first blog post."
 * post?.content; // Returns '# Heading 1\n\nHello, world!\n\n```javascript\nconsole.log("Hello World");\n```\n'
 * ```
 */
export async function getPost(slug: string): Promise<Post | null> {
  try {
    const text = await Deno.readTextFile(join("./posts", `${slug}.md`));
    const { attrs, body } = extract<Post>(text);
    return {
      ...attrs,
      slug,
      content: body,
    };
  } catch {
    return null;
  }
}

/**
 * Returns an array of {@linkcode Post} objects by reading and parsing files
 * in the `./posts` folder.
 *
 * @see {@link https://deno.land/api?s=Deno.readDir}
 *
 * @example
 * ```ts
 * import { getPosts } from "@/utils/posts.ts";
 *
 * const posts = await getPosts();
 *
 * posts[0].title; // Returns "This is my first blog post!"
 * posts[0].publishedAt; // Returns 2022-11-04T15:00:00.000Z
 * posts[0].slug; // Returns "This is an excerpt of my first blog post."
 * posts[0].content; // Returns '# Heading 1\n\nHello, world!\n\n```javascript\nconsole.log("Hello World");\n```\n'
 * ```
 */
export async function getPosts(): Promise<Post[]> {
  const posts = await Array.fromAsync(
    Deno.readDir("./posts"),
    async (file) => await getPost(file.name.replace(".md", "")),
  ) as Post[];
  return posts.toSorted((a, b) =>
    b.publishedAt.getTime() - a.publishedAt.getTime()
  );
}
