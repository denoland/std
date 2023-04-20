create table "public"."items" (
    "id" uuid not null default uuid_generate_v4(),
    "title" text not null,
    "created_at" timestamp with time zone not null default now(),
    "url" text not null,
    "author_id" uuid not null,
    "score" smallint not null default '0'::smallint
);


alter table "public"."items" enable row level security;

CREATE UNIQUE INDEX items_pkey ON public.items USING btree (id);

alter table "public"."items" add constraint "items_pkey" PRIMARY KEY using index "items_pkey";

alter table "public"."items" add constraint "items_author_id_fkey" FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."items" validate constraint "items_author_id_fkey";

alter table "public"."items" alter column "author_id" set default auth.uid();

create policy "Enable delete for users based on user_id"
on "public"."items"
as permissive
for delete
to public
using ((auth.uid() = author_id));


create policy "Enable insert for users based on user_id"
on "public"."items"
as permissive
for insert
to public
with check ((auth.uid() = author_id));


create policy "Enable read access for all users"
on "public"."items"
as permissive
for select
to public
using (true);


create policy "Enable update for users based on user_id"
on "public"."items"
as permissive
for update
to public
using ((auth.uid() = author_id))
with check ((auth.uid() = author_id));



