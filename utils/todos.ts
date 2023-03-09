import type { SupabaseClient } from "./supabase.ts";

export interface Todo {
  id: string;
  name: string;
}

const TABLE_NAME = "todos";

export async function getTodos(client: SupabaseClient) {
  const { data } = await client
    .from(TABLE_NAME)
    .select("id, name")
    .throwOnError();
  return data!;
}

export async function createTodo(client: SupabaseClient, todo: Todo) {
  await client
    .from(TABLE_NAME)
    .insert(todo)
    .throwOnError();
}

export async function deleteTodo(client: SupabaseClient, id: Todo["id"]) {
  await client
    .from(TABLE_NAME)
    .delete()
    .eq("id", id)
    .throwOnError();
}
