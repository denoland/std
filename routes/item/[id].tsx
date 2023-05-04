// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import type { State } from "@/routes/_middleware.ts";
import Layout from "@/components/Layout.tsx";
import Head from "@/components/Head.tsx";
import ItemSummary from "@/components/ItemSummary.tsx";
import {
  BUTTON_STYLES,
  INPUT_STYLES,
  SITE_WIDTH_STYLES,
} from "@/utils/constants.ts";
import { timeAgo } from "@/components/ItemSummary.tsx";
import {
  type Comment,
  createComment,
  getCommentsByItem,
  getItemById,
  getUserById,
  getUserDisplayName,
  getUsersByIds,
  type Item,
  type User,
} from "@/utils/db.ts";

interface ItemPageData extends State {
  user: User;
  item: Item;
  comments: Comment[];
  commentsUsers: User[];
}

export const handler: Handlers<ItemPageData, State> = {
  async GET(_req, ctx) {
    const { id } = ctx.params;

    const item = await getItemById(id);
    if (item === null) {
      return ctx.renderNotFound();
    }

    const comments = await getCommentsByItem(id);
    const commentsUsers = await getUsersByIds(
      comments.map((comment) => comment.userId),
    );
    const user = await getUserById(item.userId);

    return ctx.render({
      ...ctx.state,
      item,
      comments,
      user: user!,
      commentsUsers,
    });
  },
  async POST(req, ctx) {
    if (!ctx.state.session) {
      return new Response(null, {
        headers: {
          /** @todo Figure out `redirect_to` query */
          location: "/login",
        },
        status: 302,
      });
    }

    const form = await req.formData();
    const text = form.get("text");

    if (typeof text !== "string") {
      return new Response(null, { status: 400 });
    }

    await createComment({
      userId: ctx.state.session.user.id,
      itemId: ctx.params.id,
      text,
    });

    return new Response(null, {
      headers: { location: `/item/${ctx.params.id}` },
      status: 302,
    });
  },
};

export default function ItemPage(props: PageProps<ItemPageData>) {
  return (
    <>
      <Head title={props.data.item.title} />
      <Layout session={props.data.session}>
        <div class={`${SITE_WIDTH_STYLES} flex-1 px-8 space-y-4`}>
          <ItemSummary
            item={props.data.item}
            commentsCount={props.data.comments.length}
            user={props.data.user}
          />
          <div class="divide-y">
            {props.data.comments.map((comment, index) => (
              <div class="py-4">
                <p>
                  {getUserDisplayName(props.data.commentsUsers[index])}
                </p>
                <p class="text-gray-500">
                  {timeAgo(new Date(comment.createdAt))} ago
                </p>
                <p>{comment.text}</p>
              </div>
            ))}
          </div>
          <form method="post">
            <textarea
              class={INPUT_STYLES}
              type="text"
              name="text"
              required
            />
            <button type="submit" class={BUTTON_STYLES}>Comment</button>
          </form>
        </div>
      </Layout>
    </>
  );
}
