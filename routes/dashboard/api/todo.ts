// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { AuthError } from "@supabase/supabase-js";
import { createTodo, deleteTodo } from "@/utils/todos.ts";
import type { DashboardState } from "@/routes/dashboard/_middleware.ts";

export const handler: Handlers<null, DashboardState> = {
  async POST(request, ctx) {
    try {
      const todo = await request.json();
      await createTodo(ctx.state.supabaseClient, todo);

      return Response.json(null, { status: 201 });
    } catch (error) {
      console.error(error);
      const status = error instanceof AuthError ? 401 : 400;

      return new Response(error.message, { status });
    }
  },
  async DELETE(request, ctx) {
    try {
      const { id } = await request.json();
      await deleteTodo(ctx.state.supabaseClient, id);

      return new Response(null, { status: 202 });
    } catch (error) {
      const status = error instanceof AuthError ? 401 : 400;

      return new Response(error, { status });
    }
  },
};
