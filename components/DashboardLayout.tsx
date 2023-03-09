import Layout, { type LayoutProps } from "./Layout.tsx";
import { type ComponentChild, JSX } from "preact";
import IconListDetails from "tabler-icons/list-details.tsx";
import IconUser from "tabler-icons/user.tsx";

interface NavProps extends JSX.HTMLAttributes<HTMLElement> {
  active?: string;
  items: (JSX.HTMLAttributes<HTMLAnchorElement> & { inner: ComponentChild })[];
}

function Nav(props: NavProps) {
  return (
    <nav
      class={`flex gap-x-8 items-center justify-between text-white ${
        props.class ?? ""
      }`}
    >
      {props.items.map((item) => (
        <a
          href={item.href}
          class={`px-4 py-2 rounded w-full ${
            item.href === props.active
              ? "bg-pink-100 text-pink-700"
              : "text-gray-600 hover:text-black"
          }`}
        >
          {item.inner}
        </a>
      ))}
    </nav>
  );
}

export default function DashboardLayout(props: LayoutProps) {
  const navItems = [
    {
      href: "/dashboard/todos",
      inner: (
        <span class="align-middle">
          <IconListDetails class="inline-block mr-2" />Todos
        </span>
      ),
    },
    {
      href: "/dashboard/account",
      inner: (
        <span class="align-middle">
          <IconUser class="inline-block mr-2" />Account
        </span>
      ),
    },
  ];

  return (
    <Layout active="/todos">
      <div class="p-8 mx-auto max-w-5xl flex-1 flex md:flex-row flex-col w-full gap-8">
        <Nav
          {...props}
          items={navItems}
          class="w-full md:w-[16rem] md:flex-shrink-0 text-black justify-start flex-col"
        />
        <div class="flex-1">
          {props.children}
        </div>
      </div>
    </Layout>
  );
}
