// Copyright 2023 the Deno authors. All rights reserved. MIT license.
export const kv = await Deno.openKv();

const versionstamp = null;

export interface InitItemValue {
  userId: string;
  title: string;
  url: string;
}

export async function createItem(initItem: InitItemValue) {
  let res = null;
  while (res === null) {
    const itemId = crypto.randomUUID();

    const itemKey = ["items", itemId];
    const itemsByUserKey = ["items_by_user", initItem.userId, itemId];

    const item: ItemValue = { ...initItem, score: 0, createdAt: new Date() };
    res = await kv.atomic()
      .check({ key: itemKey, versionstamp })
      .check({ key: itemsByUserKey, versionstamp })
      .set(itemKey, item)
      .set(itemsByUserKey, item)
      .commit();
  }

  return res;
}

export interface ItemValue extends InitItemValue {
  createdAt: Date;
  score: number;
}

export async function getItems(options?: Deno.KvListOptions) {
  const iter = await kv.list<ItemValue>({ prefix: ["items"] }, options);
  const items = [];
  for await (const res of iter) items.push(res);
  return items;
}

export async function getItem(id: string) {
  return await kv.get<ItemValue>(["items", id]);
}

export interface InitCommentValue {
  userId: string;
  itemId: string;
  text: string;
}

export async function createComment(initComment: InitCommentValue) {
  let res = null;
  while (res === null) {
    const commentId = crypto.randomUUID();

    const commentsByUserKey = [
      "comments_by_users",
      initComment.userId,
      commentId,
    ];
    const commentsByItemKey = [
      "comments_by_item",
      initComment.itemId,
      commentId,
    ];

    const comment: CommentValue = { ...initComment, createdAt: new Date() };
    res = await kv.atomic()
      .check({ key: commentsByUserKey, versionstamp })
      .check({ key: commentsByItemKey, versionstamp })
      .set(commentsByUserKey, comment)
      .set(commentsByItemKey, comment)
      .commit();
  }

  return res;
}

export interface CommentValue extends InitCommentValue {
  createdAt: Date;
}

export async function getItemComments(
  itemId: string,
  options?: Deno.KvListOptions,
) {
  const iter = await kv.list<CommentValue>({
    prefix: ["comments_by_item", itemId],
  }, options);
  const comments = [];
  for await (const res of iter) comments.push(res);
  return comments;
}

export interface InitUserValue {
  id: string;
  stripeCustomerId: string;
}

export async function createUser(initUser: InitUserValue) {
  const usersKey = ["users", initUser.id];
  const stripeCustomersKey = [
    "user_ids_by_stripe_customer",
    initUser.stripeCustomerId,
  ];

  const user: UserValue = { ...initUser, isSubscribed: false };

  const res = await kv.atomic()
    .check({ key: usersKey, versionstamp })
    .check({ key: stripeCustomersKey, versionstamp })
    .set(usersKey, user)
    .set(stripeCustomersKey, user.id)
    .commit();

  if (res === null) {
    throw new TypeError("User with ID already exists");
  }
}

export async function getUserIdByStripeCustomerId(stripeCustomerId: string) {
  const res = await kv.get<UserValue["id"]>([
    "user_ids_by_stripe_customer",
    stripeCustomerId,
  ]);
  return res.value;
}

export async function setUserSubscription(
  id: string,
  isSubscribed: boolean,
) {
  const key = ["users", id];
  const userRes = await kv.get<UserValue>(key);

  if (userRes.value === null) throw new Error("User with ID does not exist");

  const res = await kv.atomic()
    .check(userRes)
    .set(key, { ...userRes.value, isSubscribed } as UserValue)
    .commit();

  if (res === null) {
    throw new TypeError("Atomic operation has failed");
  }
}

export async function getUser(id: string) {
  return await kv.get<UserValue>(["users", id]);
}

export interface UserValue extends InitUserValue {
  isSubscribed: boolean;
}
