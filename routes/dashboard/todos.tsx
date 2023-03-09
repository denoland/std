import type { Handlers, PageProps } from "$fresh/server.ts";
import { getTodos, type Todo } from "@/utils/todos.ts";
import { stripe } from "@/utils/stripe.ts";
import Head from "@/components/Head.tsx";
import TodoList from "@/islands/TodoList.tsx";
import Notice from "@/components/Notice.tsx";
import { DashboardState } from "./_middleware.ts";
import DashboardLayout from "@/components/DashboardLayout.tsx";

interface Data {
  isPaid: boolean;
  todos: Todo[];
}

export const handler: Handlers<Data, DashboardState> = {
  async GET(_request, ctx) {
    if (ctx.state.isLoggedIn) {
      const { data: { user }, error } = await ctx.state.supabaseClient.auth
        .getUser();
      if (error) throw error;

      const { data: [subscription] } = await stripe.subscriptions.list({
        customer: user!.user_metadata.stripe_customer_id,
      });

      return await ctx.render({
        isPaid: subscription.plan.amount > 0,
        todos: await getTodos(ctx.state.supabaseClient),
      });
    }

    return await ctx.render({
      isPaid: false,
      todos: [],
    });
  },
};

export default function TodosPage(props: PageProps<Data>) {
  return (
    <>
      <Head title="Todos" />
      <DashboardLayout active="/dashboard/todos">
        {!props.data.isPaid && (
          <Notice
            color="yellow"
            message={
              <span>
                You are on a free subscription. Please{" "}
                <a href="/account" class="underline">upgrade</a>{" "}
                to enable unlimited todos
              </span>
            }
          />
        )}
        <TodoList
          hasPaidPlan={props.data.isPaid}
          todos={props.data.todos}
        />
      </DashboardLayout>
    </>
  );
}
