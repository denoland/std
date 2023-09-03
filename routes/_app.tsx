// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { AppProps } from "$fresh/server.ts";
import Header from "@/components/Header.tsx";
import Footer from "@/components/Footer.tsx";
import type { State } from "@/middleware/session.ts";

export default function App(props: AppProps<undefined, State>) {
  return (
    <div class="dark:bg-gray-900">
      <div class="flex flex-col min-h-screen mx-auto max-w-7xl w-full dark:text-white">
        <Header
          url={props.url}
          sessionUser={props.state?.sessionUser}
          hasNotifications={props.state?.hasNotifications}
        />
        <props.Component />
        <Footer url={props.url} />
      </div>
    </div>
  );
}
