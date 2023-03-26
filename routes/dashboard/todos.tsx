import type { Handlers, PageProps } from "$fresh/server.ts";
import { getTodos, type Todo } from "@/utils/todos.ts";
import Head from "@/components/Head.tsx";
import TodoList from "@/islands/TodoList.tsx";
import Notice from "@/components/Notice.tsx";
import { DashboardState } from "./_middleware.ts";
import Dashboard from "@/components/Dashboard.tsx";
import { createSupabaseClient } from "../../utils/supabase.ts";

interface Data extends DashboardState {
  todos: Todo[];
}

export const handler: Handlers<Data, DashboardState> = {
  async GET(request, ctx) {
    const todos = await getTodos(createSupabaseClient(request.headers));

    return ctx.render({
      ...ctx.state,
      todos,
    });
  },
};

export default function TodosPage(props: PageProps<Data>) {
  return (
    <>
      <Head title="Todos" />
      <Dashboard active="/dashboard/todos">
        {!props.data.subscription.isSubscribed && (
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
          isSubscribed={props.data.subscription.isSubscribed}
          todos={props.data.todos}
        />
      </Dashboard>
    </>
  );
}
