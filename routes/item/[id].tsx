// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers, PageProps } from "$fresh/server.ts";
import type { State } from "@/routes/_middleware.ts";
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
  getManyUsers,
  getUser,
  getUserBySession,
  type Item,
  newCommentProps,
  newNotificationProps,
  Notification,
  type User,
} from "@/utils/db.ts";
import UserPostedAt from "@/components/UserPostedAt.tsx";
import { redirect, redirectToLogin } from "@/utils/redirect.ts";

interface ItemPageData extends State {
  user: User;
  item: Item;
  comments: Comment[];
  commentsUsers: User[];
  isVoted: boolean;
  lastPage: number;
}

export const handler: Handlers<ItemPageData, State> = {
  async GET(req, ctx) {
    const { id } = ctx.params;

    const url = new URL(req.url);
    const pageNum = calcPageNum(url);

    const item = await getItem(id);
    if (item === null) {
      return ctx.renderNotFound();
    }

    const allComments = await getCommentsByItem(id);
    const comments = allComments
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice((pageNum - 1) * PAGE_LENGTH, pageNum * PAGE_LENGTH);

    const commentsUsers = await getManyUsers(
      comments.map((comment) => comment.userId),
    );
    const user = await getUser(item.userId);

    const [isVoted] = await getAreVotedBySessionId(
      [item],
      ctx.state.sessionId,
    );

    const lastPage = calcLastPage(allComments.length, PAGE_LENGTH);

    ctx.state.title = item.title;

    return ctx.render({
      ...ctx.state,
      item,
      comments,
      user: user!,
      commentsUsers,
      isVoted,
      lastPage,
    });
  },
  async POST(req, ctx) {
    if (!ctx.state.sessionId) {
      return redirectToLogin(req.url);
    }

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
      userId: user.id,
      itemId: itemId,
      text,
      ...newCommentProps(),
    };
    await createComment(comment);

    if (item.userId !== user.id) {
      const notification: Notification = {
        userId: item.userId,
        type: "comment",
        text: `${user.login} commented on your post: ${item.title}`,
        originUrl: `/item/${itemId}`,
        ...newNotificationProps(),
      };
      await createNotification(notification);
    }

    return redirect(`/item/${itemId}`);
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

function CommentSummary(
  props: { user: User; comment: Comment },
) {
  return (
    <div class="py-4">
      <UserPostedAt
        user={props.user}
        createdAt={props.comment.createdAt}
      />
      <p>{props.comment.text}</p>
    </div>
  );
}

export default function ItemPage(props: PageProps<ItemPageData>) {
  return (
    <main class="flex-1 p-4 space-y-8">
      <ItemSummary
        item={props.data.item}
        isVoted={props.data.isVoted}
        user={props.data.user}
      />
      <CommentInput />
      <div>
        {props.data.comments.map((comment, index) => (
          <CommentSummary
            user={props.data.commentsUsers[index]}
            comment={comment}
          />
        ))}
      </div>
      {props.data.lastPage > 1 && (
        <PageSelector
          currentPage={calcPageNum(props.url)}
          lastPage={props.data.lastPage}
        />
      )}
    </main>
  );
}
