import type { Handlers, PageProps } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import type { DashboardState } from "./_middleware.ts";
import Dashboard from "@/components/Dashboard.tsx";

export const handler: Handlers<DashboardState, DashboardState> = {
  GET(_request, ctx) {
    return ctx.render(ctx.state);
  },
};

export default function AccountPage(props: PageProps<DashboardState>) {
  const action = props.data.customer.is_subscribed ? "Manage" : "Upgrade";

  return (
    <>
      <Head title="Account" />
      <Dashboard active="/dashboard/account">
        <ul class="space-y-2">
          <li class="flex items-center justify-between gap-2 py-2">
            <div class="flex-1">
              <strong>Email</strong>
            </div>
            <div>{props.data.session.user.email}</div>
          </li>
          <li class="flex items-center justify-between gap-2 py-2">
            <div class="flex-1">
              <strong>Subscription</strong>
            </div>
            <a
              class="underline"
              href={`/dashboard/${action.toLowerCase()}-subscription`}
            >
              {action} subscription
            </a>
          </li>
        </ul>
      </Dashboard>
    </>
  );
}
