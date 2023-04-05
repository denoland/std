// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { JSX } from "preact";
import Logo from "@/components/Logo.tsx";

export default function Header(props: JSX.HTMLAttributes<HTMLElement>) {
  return (
    <header
      {...props}
      class={`p-8 justify-between mx-auto max-w-7xl w-full flex z-10 ${
        props.class ?? ""
      }`}
    >
      <a href="/">
        <Logo height="48" />
      </a>
      {props.children}
    </header>
  );
}
