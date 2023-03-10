import type { Handlers } from "$fresh/server.ts";
import { AuthError } from "@supabase/supabase-js";
import { createSupabaseClient } from "@/utils/supabase.ts";
import { createTodo, deleteTodo } from "@/utils/todos.ts";

export const handler: Handlers = {
  async POST(request) {
    try {
      const supabaseClient = createSupabaseClient(request.headers);
      const todo = await request.json();
      await createTodo(supabaseClient, todo);

      return Response.json(null, { status: 201 });
    } catch (error) {
      const status = error instanceof AuthError ? 401 : 400;

      return new Response(error, { status });
    }
  },
  async DELETE(request) {
    try {
      const supabaseClient = createSupabaseClient(request.headers);
      const { id } = await request.json();
      await deleteTodo(supabaseClient, id);

      return new Response(null, { status: 202 });
    } catch (error) {
      const status = error instanceof AuthError ? 401 : 400;

      return new Response(error, { status });
    }
  },
};
