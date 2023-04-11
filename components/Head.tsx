// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { Head as _Head } from "$fresh/runtime.ts";
import { SITE_DESCRIPTION, SITE_NAME } from "@/constants.ts";
import Meta from "@/components/Meta.tsx";

interface HeadProps {
  title?: string;
  description?: string;
  url?: string;
}

export default function Head({ title, description, url }: HeadProps) {
  return (
    <_Head>
      <Meta
        title={title ?? SITE_NAME}
        description={description ?? SITE_DESCRIPTION}
        url={url}
      />
      <link rel="icon" href="/favicon.ico" sizes="32x32" />
    </_Head>
  );
}
