import type { Handlers, PageProps } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import type { User } from "@supabase/supabase-js";
import type { DashboardState } from "./_middleware.ts";
import Dashboard from "@/components/Dashboard.tsx";

export const handler: Handlers<User, DashboardState> = {
  async GET(_request, ctx) {
    return await ctx.render(ctx.state.session.user);
  },
};

export default function AccountPage(props: PageProps<User>) {
  return (
    <>
      <Head title="Account" />
      <Dashboard active="/dashboard/account">
        <ul class="space-y-2">
          <li class="flex items-center justify-between gap-2 py-2">
            <div class="flex-1">
              <strong>Email</strong>
            </div>
            <div>{props.data.email}</div>
          </li>
          <li class="flex items-center justify-between gap-2 py-2">
            <div class="flex-1">
              <strong>Manage subscription</strong>
            </div>
            <a class="underline" href="/dashboard/manage-subscription">
              Go to customer portal
            </a>
          </li>
        </ul>
      </Dashboard>
    </>
  );
}
