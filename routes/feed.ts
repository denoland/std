import { Feed, Item as FeedItem } from "feed";
import { getPosts } from "../utils/posts.ts";

const copyright = `Copyright ${new Date().getFullYear()} Deno Land Inc.`;

export const handler = {
  // Use https://validator.w3.org/feed/ to validate RSS feed syntax.
  GET: async (req: Request) => {
    const { origin } = new URL(req.url);
    const feed = new Feed({
      title: "Deno",
      description: "The latest news from Deno Land Inc.",
      id: `${origin}/blog`,
      link: `${origin}/blog`,
      language: "en",
      favicon: `${origin}/favicon.ico`,
      copyright: copyright,
      generator: "Feed (https://github.com/jpmonette/feed) for Deno",
      feedLinks: {
        atom: `${origin}/feed`,
      },
    });

    const posts = await getPosts();
    for (const post of posts) {
      const item: FeedItem = {
        id: `${origin}/blog/${post.slug}`,
        title: post.title,
        description: post.summary,
        date: new Date(post.publishedAt),
        link: `${origin}/blog/${post.slug}`,
        author: [{ name: "The Deno Authors" }],
        copyright,
        published: new Date(post.publishedAt),
      };
      feed.addItem(item);
    }

    const atomFeed = feed.atom1();
    return new Response(atomFeed, {
      headers: {
        "content-type": "application/atom+xml; charset=utf-8",
      },
    });
  },
};
