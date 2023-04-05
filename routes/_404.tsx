// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import Head from "@/components/Head.tsx";
import Logo from "@/components/Logo.tsx";

export default function NotFoundPage() {
  return (
    <>
      <Head title="Page not found" />
      <div class="h-screen flex flex-col justify-center mx-auto max-w-7xl p-4 text-center space-y-4">
        <Logo />
        <h1 class="text-4xl inline-block font-bold">Page not found</h1>
        <p class="text-xl text-blue-900">
          <a href="/">Return home</a>
        </p>
      </div>
    </>
  );
}
