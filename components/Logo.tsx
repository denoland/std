// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { JSX } from "preact";
import { SITE_NAME } from "@/constants.ts";

export default function Logo(props: JSX.HTMLAttributes<HTMLImageElement>) {
  const height = props.height ?? 96;
  const width = height;

  return (
    <img
      {...props}
      height={height}
      width={width}
      src="/logo.webp"
      alt={`${SITE_NAME} logo`}
      class={`h-[${height}px] w-[${width}px] mx-auto ${props.class ?? ""}`}
    />
  );
}
