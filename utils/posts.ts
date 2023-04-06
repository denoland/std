// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { extract } from "std/front_matter/yaml.ts";
import { join } from "std/path/mod.ts";

export interface Post {
  slug: string;
  title: string;
  publishedAt: Date;
  content: string;
  summary: string;
}

export async function getPosts(): Promise<Post[]> {
  const files = Deno.readDir("./data/posts");
  const promises = [];
  for await (const file of files) {
    const slug = file.name.replace(".md", "");
    promises.push(getPost(slug));
  }
  const posts = await Promise.all(promises) as Post[];
  posts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  return posts;
}

export async function getPost(slug: string): Promise<Post | null> {
  try {
    const text = await Deno.readTextFile(
      join("./data/posts", `${slug}.md`),
    );
    const { attrs, body } = extract(text);
    return {
      slug,
      title: attrs.title as string,
      publishedAt: new Date(attrs.published_at as Date) || null,
      content: body,
      summary: attrs.summary as string || "",
    };
  } catch {
    return null;
  }
}
