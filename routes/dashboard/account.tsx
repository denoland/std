import type { Handlers, PageProps } from "$fresh/server.ts";
import Head from "@/components/Head.tsx";
import type { User } from "@supabase/supabase-js";
import type { DashboardState } from "./_middleware.ts";
import Dashboard from "@/components/Dashboard.tsx";
import { stripe } from "@/utils/stripe.ts";

interface PageData {
  subscribed: boolean;
  user: User;
}

export const handler: Handlers<PageData, DashboardState> = {
  async GET(_request, ctx) {
    const { user } = ctx.state.session;
    const { data: [subscription] } = await stripe.subscriptions.list({
      customer: user.user_metadata.stripe_customer_id,
    });

    return await ctx.render({
      subscribed: Boolean(subscription),
      user: ctx.state.session.user,
    });
  },
};

export default function AccountPage(props: PageProps<PageData>) {
  const action = props.data.subscribed ? "Manage" : "Upgrade";

  return (
    <>
      <Head title="Account" />
      <Dashboard active="/dashboard/account">
        <ul class="space-y-2">
          <li class="flex items-center justify-between gap-2 py-2">
            <div class="flex-1">
              <strong>Email</strong>
            </div>
            <div>{props.data.user.email}</div>
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
