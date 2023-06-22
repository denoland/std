// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { AppProps } from "$fresh/server.ts";
import Layout from "@/components/Layout.tsx";

export default function App({ Component, data }: AppProps) {
  return (
    <div>
      <Layout session={data.sessionId}>
        <Component />
      </Layout>
    </div>
  );
}
