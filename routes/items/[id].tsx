// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, RouteContext } from "$fresh/server.ts";
import ItemSummary from "@/components/ItemSummary.tsx";
import PageSelector from "@/components/PageSelector.tsx";
import { BUTTON_STYLES, INPUT_STYLES } from "@/utils/constants.ts";
import { calcLastPage, calcPageNum, PAGE_LENGTH } from "@/utils/pagination.ts";
import {
  type Comment,
  createComment,
  createNotification,
  getAreVotedBySessionId,
  getCommentsByItem,
  getItem,
  getUserBySession,
  newCommentProps,
  newNotificationProps,
  Notification,
} from "@/utils/db.ts";
import UserPostedAt from "@/components/UserPostedAt.tsx";
import { redirect } from "@/utils/redirect.ts";
import Head from "@/components/Head.tsx";
import { SignedInState } from "@/utils/middleware.ts";

export const handler: Handlers<unknown, SignedInState> = {
  async POST(req, ctx) {
    const form = await req.formData();
    const text = form.get("text");

    if (typeof text !== "string") {
      return new Response(null, { status: 400 });
    }

    const itemId = ctx.params.id;
    const user = await getUserBySession(ctx.state.sessionId);
    const item = await getItem(itemId);

    if (item === null || user === null) {
      return new Response(null, { status: 404 });
    }

    const comment: Comment = {
      userLogin: user.login,
      itemId: itemId,
      text,
      ...newCommentProps(),
    };
    await createComment(comment);

    if (item.userLogin !== user.login) {
      const notification: Notification = {
        userLogin: item.userLogin,
        type: "comment",
        text: `${user.login} commented on your post: ${item.title}`,
        originUrl: `/items/${itemId}`,
        ...newNotificationProps(),
      };
      await createNotification(notification);
    }

    return redirect(`/items/${itemId}`);
  },
};

function CommentInput() {
  return (
    <form method="post">
      <textarea
        class={`${INPUT_STYLES} w-full`}
        type="text"
        name="text"
        required
      />
      <button type="submit" class={BUTTON_STYLES}>Comment</button>
    </form>
  );
}

function CommentSummary(comment: Comment) {
  return (
    <div class="py-4">
      <UserPostedAt
        userLogin={comment.userLogin}
        createdAt={comment.createdAt}
      />
      <p>{comment.text}</p>
    </div>
  );
}

export default async function ItemsItemPage(
  _req: Request,
  ctx: RouteContext<undefined, SignedInState>,
) {
  const { id } = ctx.params;
  const item = await getItem(id);
  if (item === null) return await ctx.renderNotFound();

  const pageNum = calcPageNum(ctx.url);
  const allComments = await getCommentsByItem(id);
  const comments = allComments
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice((pageNum - 1) * PAGE_LENGTH, pageNum * PAGE_LENGTH);

  const [isVoted] = await getAreVotedBySessionId(
    [item],
    ctx.state.sessionId,
  );

  const lastPage = calcLastPage(allComments.length, PAGE_LENGTH);

  return (
    <>
      <Head title={item.title} href={ctx.url.href} />
      <main class="flex-1 p-4 space-y-8">
        <ItemSummary
          item={item}
          isVoted={isVoted}
        />
        <CommentInput />
        <div>
          {comments.map((comment) => (
            <CommentSummary
              {...comment}
            />
          ))}
        </div>
        {lastPage > 1 && (
          <PageSelector
            currentPage={calcPageNum(ctx.url)}
            lastPage={lastPage}
          />
        )}
      </main>
    </>
  );
}
