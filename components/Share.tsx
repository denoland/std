// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { Facebook, LinkedIn, Reddit, Twitter } from "./Icons.tsx";

/**
 * Dynamically generates links for sharing the current content on the major social media platforms.
 *
 * Inspired by https://schier.co/blog/pure-html-share-buttons
 *
 * Features:
 * - Each link provides the title, where possible
 * - Links are opened in a new page
 * - Accessible labels are provided, as logos are used as the content for each link
 * - Each logo respects the branding color of the respective social media platform.
 */
export default function Share(props: { url: URL; title: string }) {
  return (
    <div class="flex flex-row gap-4 my-4">
      <span class="align-middle">Share</span>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${props.url.href}`}
        target="_blank"
        aria-label={`Share ${props.title} on Facebook`}
      >
        <Facebook />
      </a>
      <a
        href={`https://www.linkedin.com/shareArticle?url=${props.url.href}&title=${props.title}`}
        target="_blank"
        aria-label={`Share ${props.title} on LinkedIn`}
      >
        <LinkedIn />
      </a>
      <a
        href={`https://reddit.com/submit?url=${props.url.href}&title=${props.title}`}
        target="_blank"
        aria-label={`Share ${props.title} on Reddit`}
      >
        <Reddit />
      </a>
      <a
        href={`https://twitter.com/share?url=${props.url.href}&text=${props.title}`}
        target="_blank"
        aria-label={`Share ${props.title} on Twitter`}
      >
        <Twitter />
      </a>
    </div>
  );
}
