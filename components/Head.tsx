// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { Head as _Head, type HeadProps as _HeadProps } from "$fresh/runtime.ts";
import type { ComponentChildren } from "preact";
import { SITE_DESCRIPTION, SITE_NAME } from "@/utils/constants.ts";

interface MetaProps {
  /**
   * @default {string} `SITE_NAME` in `@/utils/constants.ts`
   */
  title?: string;
  /**
   * @default {string} `SITE_DESCRIPTION` in `@/utils/constants.ts`
   */
  description?: string;
  imageUrl?: string;
  href?: string;
}

const DEFAULT_META_PROPS = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
};

export function Meta(props: MetaProps = DEFAULT_META_PROPS) {
  const { description, imageUrl, href }: MetaProps = {
    ...DEFAULT_META_PROPS,
    ...props,
  };
  const title = props.title ? `${props.title} ▲ ${SITE_NAME}` : SITE_NAME;

  return (
    <>
      {/* HTML Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Google / Search Engine Tags */}
      <meta itemProp="name" content={title} />
      <meta itemProp="description" content={description} />
      {imageUrl && <meta itemProp="image" content={imageUrl} />}

      {/* Facebook Meta Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={title} />
      <meta property="og:locale" content="en" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {href && <meta property="og:url" content={href} />}
      {imageUrl && <meta property="og:image" content={imageUrl} />}

      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
    </>
  );
}

export interface HeadProps extends MetaProps {
  children?: ComponentChildren;
}

export default function Head(props: HeadProps) {
  return (
    <_Head>
      <Meta {...props} />
      {props.children}
    </_Head>
  );
}
