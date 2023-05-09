// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import Head from "@/components/Head.tsx";
import { ErrorPageProps } from "$fresh/server.ts";
import Logo from "@/components/Logo.tsx";
import { SITE_WIDTH_STYLES } from "@/utils/constants.ts";

export default function Error500Page(props: ErrorPageProps) {
  return (
    <>
      <Head title="Server error" href={props.url.href} />
      <div
        class={`h-screen flex flex-col justify-center ${SITE_WIDTH_STYLES} p-4 text-center space-y-4`}
      >
        <Logo />
        <h1 class="text-4xl inline-block font-bold">Server error</h1>
        <p>500 internal error: {(props.error as Error).message}</p>
        <p class="text-xl text-blue-900">
          <a href="/">Return home</a>
        </p>
      </div>
    </>
  );
}
