// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { type Signal, useSignal } from "@preact/signals";
import { IS_BROWSER } from "$fresh/runtime.ts";
import type { Todo } from "@/utils/todos.ts";
import {
  BASE_BUTTON_STYLES,
  BASE_INPUT_STYLES,
  FREE_PLAN_TODOS_LIMIT,
} from "@/constants.ts";
import IconTrash from "tabler-icons/trash.tsx";
import { assert } from "std/testing/asserts.ts";
import { useRef } from "preact/hooks";

async function requestCreateTodo(todo: Todo) {
  const response = await fetch("/dashboard/api/todo", {
    method: "POST",
    body: JSON.stringify(todo),
  });
  assert(response.ok);
}

function createTodoInSignal(todos: Signal<Todo[]>, todo: Todo) {
  todos.value = [...todos.value, todo];
}

async function createTodo(
  todos: Signal<Todo[]>,
  name: string,
) {
  const newTodo: Todo = { name, id: crypto.randomUUID() };
  if (IS_BROWSER) await requestCreateTodo(newTodo);
  createTodoInSignal(todos, newTodo);
}

async function requestDeleteTodo(id: string) {
  const response = await fetch("/dashboard/api/todo", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
  assert(response.ok);
}

function deleteTodoInSignal(todos: Signal<Todo[]>, id: string) {
  todos.value = todos.value.filter((todo) => todo.id !== id);
}

async function deleteTodo(
  todos: Signal<Todo[]>,
  id: string,
) {
  if (IS_BROWSER) await requestDeleteTodo(id);
  deleteTodoInSignal(todos, id);
}

interface TodoListProps {
  isSubscribed: boolean;
  todos: Todo[];
}

export default function TodoList(props: TodoListProps) {
  const todos = useSignal(props.todos);
  const newTodoRef = useRef<HTMLInputElement | null>(null);

  const isMoreTodos = props.isSubscribed ||
    todos.value.length < FREE_PLAN_TODOS_LIMIT;

  return (
    <div class="space-y-4">
      <ul class="divide-y space-y-2">
        {todos.value.map((todo) => (
          <li class="flex items-center justify-between gap-2 p-2">
            <div class="flex-1">
              {todo.name}
            </div>
            <IconTrash
              onClick={async () => await deleteTodo(todos, todo.id)}
              class="cursor-pointer text-red-600"
            />
          </li>
        ))}
      </ul>
      <form
        class="flex gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await createTodo(todos, newTodoRef.current!.value);
          newTodoRef.current!.form!.reset();
        }}
      >
        <input
          ref={newTodoRef}
          disabled={!isMoreTodos}
          class={`${BASE_INPUT_STYLES} flex-1`}
          required
        />
        <button
          disabled={!isMoreTodos}
          type="submit"
          class={`${BASE_BUTTON_STYLES} px-4`}
        >
          +
        </button>
      </form>
    </div>
  );
}
