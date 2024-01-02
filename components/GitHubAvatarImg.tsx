// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
export interface GitHubAvatarImgProps {
  /** The GitHub user's username */
  login: string;
  /** The height and width (1:1 ratio) of the image, in pixels */
  size: number;
  /** Additional classes */
  class?: string;
}

export default function GitHubAvatarImg(props: GitHubAvatarImgProps) {
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
