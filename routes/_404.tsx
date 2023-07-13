// Copyright 2023 the Deno authors. All rights reserved. MIT license.
export default function NotFoundPage() {
  return (
    <main class="flex-1 flex flex-col justify-center p-4 text-center space-y-4">
      <h1 class="text-4xl inline-block font-bold">Page not found</h1>
      <p class="text-xl text-blue-900">
        <a href="/">Return home</a>
      </p>
    </main>
  );
}
