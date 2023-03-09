import { type ComponentChild, JSX } from "preact";

interface NavProps extends JSX.HTMLAttributes<HTMLElement> {
  active?: string;
  items: (JSX.HTMLAttributes<HTMLAnchorElement> & { inner: ComponentChild })[];
}

export default function Nav(props: NavProps) {
  return (
    <nav
      class={`flex gap-x-8 gap-y-2 items-center justify-between text-white ${
        props.class ?? ""
      }`}
    >
      {props.items.map((item) => <a href={item.href}>{item.inner}</a>)}
    </nav>
  );
}
