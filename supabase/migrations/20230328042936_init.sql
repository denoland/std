create table "public"."todos" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text,
    "user_id" uuid not null default auth.uid()
);


alter table "public"."todos" enable row level security;

CREATE UNIQUE INDEX todos_pkey ON public.todos USING btree (id);

alter table "public"."todos" add constraint "todos_pkey" PRIMARY KEY using index "todos_pkey";

alter table "public"."todos" add constraint "todos_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."todos" validate constraint "todos_user_id_fkey";

create policy "Enable all operations for users based on user_id"
on "public"."todos"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));