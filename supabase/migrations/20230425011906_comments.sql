create table "public"."comments" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null default auth.uid(),
    "item_id" uuid not null,
    "text" text not null
);


alter table "public"."comments" enable row level security;

CREATE UNIQUE INDEX comments_pkey ON public.comments USING btree (id);

alter table "public"."comments" add constraint "comments_pkey" PRIMARY KEY using index "comments_pkey";

alter table "public"."comments" add constraint "comments_item_id_fkey" FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE not valid;

alter table "public"."comments" validate constraint "comments_item_id_fkey";

alter table "public"."comments" add constraint "comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."comments" validate constraint "comments_user_id_fkey";

create policy "Enable delete for users based on user_id"
on "public"."comments"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Enable insert for users based on user_id"
on "public"."comments"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Enable read access for all users"
on "public"."comments"
as permissive
for select
to public
using (true);


create policy "Enable update for users based on user_id"
on "public"."comments"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



