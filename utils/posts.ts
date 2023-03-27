import { extract } from "std/encoding/front_matter/yaml.ts";
import { join } from "std/path/mod.ts";

export interface Post {
  slug: string;
  title: string;
  publishedAt: Date;
  content: string;
  abstract: string;
}

export async function getPosts(): Promise<Post[]> {
  const files = Deno.readDir("./routes/blog");
  const promises = [];
  for await (const file of files) {
    if (file.name.endsWith(".tsx")) continue;
    const slug = file.name.replace(".md", "");
    promises.push(getPost(slug));
  }
  const posts = await Promise.all(promises) as Post[];
  posts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  return posts;
}

export async function getPost(slug: string): Promise<Post | null> {
  const text = await Deno.readTextFile(
    join("./routes/blog", `${slug}`, `index.md`),
  );
  const { attrs, body } = extract(text);
  return {
    slug,
    title: attrs.title as string,
    publishedAt: new Date(attrs.published_at as Date),
    content: body,
    abstract: attrs.abstract as string,
  };
}
