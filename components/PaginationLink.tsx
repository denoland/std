// Copyright 2023 the Deno authors. All rights reserved. MIT license.
export default function Pagination(
  props: { url: URL; cursor?: string; class?: string },
) {
  const url = new URL(props.url);
  let text: string;
  if (props.cursor) {
    url.searchParams.set("cursor", props.cursor);
    text = "Next ›";
  } else {
    url.searchParams.delete("cursor");
    text = "Back to start ↻";
  }
  return props.url.href === url.href
    ? null
    : <a href={url.href} class={props.class}>{text}</a>;
}
