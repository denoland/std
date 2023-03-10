import { SITE_NAME } from "@/constants.ts";
import { JSX } from "preact";
import Nav from "./Nav.tsx";

export default function Footer(props: JSX.HTMLAttributes<HTMLElement>) {
  const navItems = [
    {
      href: "https://discord.gg/deno",
      inner: "Discord",
    },
  ];

  return (
    <footer
      {...props}
      class={`flex flex-col md:flex-row w-full p-8 justify-between gap-y-4 mx-auto max-w-7xl ${
        props.class ?? ""
      }`}
    >
      <span>
        <strong>{SITE_NAME}</strong>
      </span>
      <Nav items={navItems} />
    </footer>
  );
}
