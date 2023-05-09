// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import Head from "@/components/Head.tsx";
import Logo from "@/components/Logo.tsx";
import { SITE_WIDTH_STYLES } from "@/utils/constants.ts";
import type { UnknownPageProps } from "$fresh/server.ts";

export default function NotFoundPage(props: UnknownPageProps) {
  return (
    <>
      <Head title="Page not found" href={props.url.href} />
      <div
        class={`h-screen flex flex-col justify-center ${SITE_WIDTH_STYLES} p-4 text-center space-y-4`}
      >
        <Logo />
        <h1 class="text-4xl inline-block font-bold">Page not found</h1>
        <p class="text-xl text-blue-900">
          <a href="/">Return home</a>
        </p>
      </div>
    </>
  );
}
