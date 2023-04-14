// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { SITE_DESCRIPTION, SITE_NAME } from "@/constants.ts";

interface MetaProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  href?: string;
}

export default function Meta(props: MetaProps) {
  const { title, description, imageUrl, href } = props;

  return (
    <>
      {/* HTML Meta Tags */}
      <title>{title || SITE_NAME}</title>
      <meta
        name="description"
        content={description || SITE_DESCRIPTION}
      />

      {/* Google / Search Engine Tags */}
      <meta
        itemProp="name"
        content={title || SITE_NAME}
      />
      <meta
        itemProp="description"
        content={description || SITE_DESCRIPTION}
      />
      {imageUrl && (
        <meta
          itemProp="image"
          content={imageUrl}
        />
      )}

      {/* Facebook Meta Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en" />
      <meta property="og:type" content="website" />
      <meta
        property="og:title"
        content={title || SITE_NAME}
      />
      <meta
        property="og:description"
        content={description || SITE_DESCRIPTION}
      />
      {href && (
        <meta
          property="og:url"
          content={href}
        />
      )}
      {imageUrl && (
        <meta
          property="og:image"
          content={imageUrl}
        />
      )}

      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content={title || SITE_NAME}
      />
      <meta
        name="twitter:description"
        content={description || SITE_DESCRIPTION}
      />
      {imageUrl && (
        <meta
          name="twitter:image"
          content={imageUrl}
        />
      )}
    </>
  );
}
