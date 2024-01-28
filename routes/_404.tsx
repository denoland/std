// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.

export default function NotFoundPage() {
  return (
    <main class="flex-1 p-4 flex flex-col justify-center text-center">
      <h1 class="heading-styles">Page not found</h1>
      <p>
        <a href="/" class="link-styles">Return home &#8250;</a>
      </p>
    </main>
  );
}
