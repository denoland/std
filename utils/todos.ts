// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase_types.ts";

const TABLE_NAME = "todos";

export type Todo = Database["public"]["Tables"]["todos"]["Insert"];

export async function getTodos(client: SupabaseClient<Database>) {
  const { data } = await client
    .from(TABLE_NAME)
    .select("id, name")
    .throwOnError();
  return data!;
}

export async function createTodo(
  client: SupabaseClient<Database>,
  todo: Todo,
) {
  await client
    .from(TABLE_NAME)
    .insert(todo)
    .throwOnError();
}

export async function deleteTodo(
  client: SupabaseClient<Database>,
  id: Todo["id"],
) {
  await client
    .from(TABLE_NAME)
    .delete()
    .eq("id", id)
    .throwOnError();
}
