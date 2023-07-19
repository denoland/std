// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { AppProps } from "$fresh/server.ts";
import Header from "@/components/Header.tsx";
import Footer from "@/components/Footer.tsx";

export default function App(props: AppProps) {
  return (
    <div class="dark:bg-gray-900 text-lg">
      <div class="flex flex-col min-h-screen mx-auto max-w-7xl w-full dark:text-white">
        <Header
          url={props.url}
          sessionId={props.data?.sessionId}
          hasNotifications={props.data?.hasNotifications}
        />
        <props.Component />
        <Footer url={props.url} />
      </div>
    </div>
  );
}
