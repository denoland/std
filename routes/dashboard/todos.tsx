import type { Handlers, PageProps } from "$fresh/server.ts";
import { getTodos } from "@/utils/todos.ts";
import Head from "@/components/Head.tsx";
import TodoList from "@/islands/TodoList.tsx";
import Notice from "@/components/Notice.tsx";
import { DashboardState } from "./_middleware.ts";
import Dashboard from "@/components/Dashboard.tsx";
import { Database } from "@/utils/supabase_types.ts";

interface TodosPageProps extends DashboardState {
  todos: Database["public"]["Tables"]["todos"]["Insert"][];
}

export const handler: Handlers<TodosPageProps, DashboardState> = {
  async GET(_request, ctx) {
    const todos = await getTodos(ctx.state.supabaseClient);
    return ctx.render({
      ...ctx.state,
      todos,
    });
  },
};

export default function TodosPage(props: PageProps<TodosPageProps>) {
  return (
    <>
      <Head title="Todos" />
      <Dashboard active="/dashboard/todos">
        {!props.data.customer.is_subscribed && (
          <Notice
            color="yellow"
            message={
              <span>
                You are on a free subscription. Please{" "}
                <a href="/dashboard/upgrade-subscription" class="underline">
                  upgrade
                </a>{" "}
                to enable unlimited todos
              </span>
            }
          />
        )}
        <TodoList
          isSubscribed={props.data.customer.is_subscribed!}
          todos={props.data.todos}
        />
      </Dashboard>
    </>
  );
}
