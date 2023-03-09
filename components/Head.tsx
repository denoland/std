import { Head as _Head } from "$fresh/runtime.ts";
import { SITE_DESCRIPTION, SITE_NAME } from "@/constants.ts";

interface HeadProps {
  title?: string;
  description?: string;
}

export default function Head({ title, description }: HeadProps) {
  return (
    <_Head>
      <title>{title ?? SITE_NAME}</title>
      <link rel="icon" href="/favicon.ico" sizes="32x32" />
      <meta name="description" content={description ?? SITE_DESCRIPTION} />
    </_Head>
  );
}
