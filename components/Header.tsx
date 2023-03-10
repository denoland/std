import { SITE_NAME } from "../constants.ts";
import Nav from "./Nav.tsx";
import { JSX } from "preact";

function HeaderLogo() {
  return <strong class="font-bold text-2xl">{SITE_NAME}</strong>;
}

export default function Header(props: JSX.HTMLAttributes<HTMLElement>) {
  const navItems = [
    {
      href: "/",
      inner: <HeaderLogo />,
    },
    {
      href: "/dashboard",
      inner: "Dashboard",
    },
  ];

  return (
    <header
      {...props}
      class={`p-8 justify-between mx-auto max-w-7xl w-full ${
        props.class ?? ""
      }`}
    >
      <Nav items={navItems} />
    </header>
  );
}
