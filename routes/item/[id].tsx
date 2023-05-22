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
import {
  type Comment,
  createComment,
  getCommentsByItem,
  getItemById,
  getUserById,
  getUserBySessionId,
  getUsersByIds,
  getVotedItemIdsByUser,
  type Item,
  type User,
} from "@/utils/db.ts";
import { redirect } from "@/utils/http.ts";
import UserPostedAt from "@/components/UserPostedAt.tsx";
import { pluralize } from "@/utils/display.ts";

interface ItemPageData extends State {
  user: User;
  item: Item;
  comments: Comment[];
  commentsUsers: User[];
  isVoted: boolean;
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

    let votedItemIds: string[] = [];
    if (ctx.state.sessionId) {
      const sessionUser = await getUserBySessionId(ctx.state.sessionId);
      votedItemIds = await getVotedItemIdsByUser(sessionUser!.id);
    }

    const isVoted = votedItemIds.includes(id);

    return ctx.render({
      ...ctx.state,
      item,
      comments,
      user: user!,
      commentsUsers,
      isVoted,
    });
  },
  async POST(req, ctx) {
    if (!ctx.state.sessionId) {
      return redirect("/login");
    }

    const form = await req.formData();
    const text = form.get("text");

    if (typeof text !== "string") {
      return new Response(null, { status: 400 });
    }

    const user = await getUserBySessionId(ctx.state.sessionId);

    await createComment({
      userId: user!.id,
      itemId: ctx.params.id,
      text,
    });

    return redirect(`/item/${ctx.params.id}`);
  },
};

export default function ItemPage(props: PageProps<ItemPageData>) {
  return (
    <>
      <Head title={props.data.item.title} href={props.url.href} />
      <Layout session={props.data.sessionId}>
        <div class={`${SITE_WIDTH_STYLES} flex-1 px-4 space-y-8`}>
          <ItemSummary
            item={props.data.item}
            isVoted={props.data.isVoted}
            user={props.data.user}
          />
          <form method="post">
            <textarea
              class={INPUT_STYLES}
              type="text"
              name="text"
              required
            />
            <button type="submit" class={BUTTON_STYLES}>Comment</button>
          </form>
          <div>
            <h2>
              <strong>
                {pluralize(props.data.comments.length, "comment")}
              </strong>
            </h2>
            {props.data.comments.sort((a, b) =>
              b.createdAt.getTime() - a.createdAt.getTime()
            ).map((comment, index) => (
              <div class="py-4">
                <UserPostedAt
                  user={props.data.commentsUsers[index]}
                  createdAt={comment.createdAt}
                />
                <p>{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    </>
  );
}
