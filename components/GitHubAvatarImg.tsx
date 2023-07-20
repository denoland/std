// Copyright 2023 the Deno authors. All rights reserved. MIT license.
export default function GitHubAvatarImg(
  props: {
    // AKA GitHub user's username.
    login: string;
    // Defines the rended height and width of the image, in pixels.
    size: number;
    class?: string;
  },
) {
  return (
    <img
      height={props.size}
      width={props.size}
      // Intrinsic size is 2x rendered size for Retina displays
      src={`https://avatars.githubusercontent.com/${props.login}?s=${
        props.size * 2
      }`}
      alt={`GitHub avatar of ${props.login}`}
      class={`rounded-full inline-block aspect-square h-[${props.size}px] w-[${props.size}px] ${
        props.class ?? ""
      }`}
      crossOrigin="anonymous"
      loading="lazy"
    />
  );
}
