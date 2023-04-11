// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { SITE_DESCRIPTION, SITE_NAME } from "@/constants.ts";

interface MetaProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  url?: string;
}

export default function Meta(props: MetaProps) {
  const { title, description, imageUrl, url } = props;

  return (
    <>
      {/* HTML Meta Tags */}
      <title>{title || SITE_NAME}</title>
      <meta
        name="description"
        content={description || SITE_DESCRIPTION}
      />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={title || SITE_NAME} />
      <meta property="og:locale" content="en" />

      {/* Google / Search Engine Tags */}
      <meta
        itemProp="name"
        content={title || SITE_NAME}
      />
      <meta
        itemProp="description"
        content={description || SITE_DESCRIPTION}
      />
      <meta
        itemProp="image"
        content={imageUrl}
      />

      {/* Facebook Meta Tags */}
      <meta
        property="og:url"
        content={url}
      />
      <meta property="og:type" content="website" />
      <meta
        property="og:title"
        content={title || SITE_NAME}
      />
      <meta
        property="og:description"
        content={description || SITE_DESCRIPTION}
      />
      <meta
        property="og:image"
        content={imageUrl}
      />

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
      <meta
        name="twitter:image"
        content={imageUrl}
      />
    </>
  );
}
