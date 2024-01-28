// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
export interface MetaProps {
  /** Title of the current page */
  title: string;
  /** Description of the current page */
  description: string;
  /** URL of the current page */
  href: string;
  /** URL of the cover image */
  imageUrl: string;
}

export default function Meta(props: MetaProps) {
  return (
    <>
      {/* HTML Meta Tags */}
      <title>{props.title}</title>
      <meta name="description" content={props.description} />

      {/* Google / Search Engine Tags */}
      <meta itemProp="name" content={props.title} />
      <meta itemProp="description" content={props.description} />
      {props.imageUrl && <meta itemProp="image" content={props.imageUrl} />}

      {/* Facebook Meta Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={props.title} />
      <meta property="og:locale" content="en" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={props.title} />
      <meta property="og:description" content={props.description} />
      <meta property="og:url" content={props.href} />
      <meta property="og:image" content={props.imageUrl} />

      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={props.title} />
      <meta name="twitter:description" content={props.description} />
      <meta name="twitter:image" content={props.imageUrl} />
    </>
  );
}
