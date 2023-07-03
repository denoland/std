// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { AppProps } from "$fresh/server.ts";
import Header from "@/components/Header.tsx";
import Footer from "@/components/Footer.tsx";
import { Head } from "$fresh/runtime.ts";
import Meta from "@/components/Meta.tsx";

export default function App(props: AppProps) {
  return (
    <>
      <Head>
        <Meta
          title={props.data?.title}
          description={props.data?.description}
          href={props.url.href}
        />
      </Head>
      <div class="dark:bg-gray-900">
        <div class="flex flex-col min-h-screen mx-auto max-w-7xl w-full dark:text-white">
          <Header
            sessionId={props.data?.sessionId}
            hasNotifications={props.data?.hasNotifications}
          />
          <props.Component />
          <Footer />
        </div>
      </div>
    </>
  );
}
