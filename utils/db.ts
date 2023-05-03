// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { stripe } from "./payments.ts";

export const kv = await Deno.openKv();

interface InitItem {
  userId: string;
  title: string;
  url: string;
}

export interface Item extends InitItem {
  id: string;
  createdAt: Date;
  score: number;
}

export async function createItem(initItem: InitItem) {
  let res = { ok: false };
  while (!res.ok) {
    const id = crypto.randomUUID();
    const itemKey = ["items", id];
    const itemsByUserKey = ["items_by_user", initItem.userId, id];
    const item: Item = {
      ...initItem,
      id,
      score: 0,
      createdAt: new Date(),
    };

    res = await kv.atomic()
      .check({ key: itemKey, versionstamp: null })
      .check({ key: itemsByUserKey, versionstamp: null })
      .set(itemKey, item)
      .set(itemsByUserKey, item)
      .commit();

    return item;
  }
}

export async function getAllItems(options?: Deno.KvListOptions) {
  const iter = await kv.list<Item>({ prefix: ["items"] }, options);
  const items = [];
  for await (const res of iter) items.push(res.value);
  return items;
}

export async function getItemById(id: string) {
  const res = await kv.get<Item>(["items", id]);
  return res.value;
}

interface InitComment {
  userId: string;
  itemId: string;
  text: string;
}

export interface Comment extends InitComment {
  id: string;
  createdAt: Date;
}

export async function createComment(initComment: InitComment) {
  let res = { ok: false };
  while (!res.ok) {
    const id = crypto.randomUUID();
    const commentsByUserKey = ["comments_by_users", initComment.userId, id];
    const commentsByItemKey = ["comments_by_item", initComment.itemId, id];
    const comment: Comment = { ...initComment, id, createdAt: new Date() };

    res = await kv.atomic()
      .check({ key: commentsByUserKey, versionstamp: null })
      .check({ key: commentsByItemKey, versionstamp: null })
      .set(commentsByUserKey, comment)
      .set(commentsByItemKey, comment)
      .commit();

    return comment;
  }
}

export async function getCommentsByItem(
  itemId: string,
  options?: Deno.KvListOptions,
) {
  const iter = await kv.list<Comment>({
    prefix: ["comments_by_item", itemId],
  }, options);
  const comments = [];
  for await (const res of iter) comments.push(res.value);
  return comments;
}

export async function getItemCommentsCountsByIds(
  ids: string[],
  options?: Deno.KvListOptions,
) {
  const keys = ids.map((id) => ["comments_by_item", id]);
  const items: number[] = [];
  for (let i = 0; i < keys.length; i++) {
    const iter = await kv.list<Comment>({
      prefix: keys[i],
    }, options);

    let commentsCount = 0;
    for await (const _ of iter) {
      commentsCount++;
    }
    items.push(commentsCount);
  }
  return items;
}

interface InitUser {
  id: string;
  stripeCustomerId: string;
}

export interface User extends InitUser {
  isSubscribed: boolean;
}

export async function createUser(initUser: InitUser) {
  const usersKey = ["users", initUser.id];
  const stripeCustomersKey = [
    "user_ids_by_stripe_customer",
    initUser.stripeCustomerId,
  ];
  const user: User = { ...initUser, isSubscribed: false };

  const res = await kv.atomic()
    .check({ key: usersKey, versionstamp: null })
    .check({ key: stripeCustomersKey, versionstamp: null })
    .set(usersKey, user)
    .set(stripeCustomersKey, user.id)
    .commit();

  if (!res.ok) {
    throw res;
  }

  return user;
}

export async function getUserById(id: string) {
  const res = await kv.get<User>(["users", id]);
  return res.value;
}

export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  const res = await kv.get<string>([
    "user_ids_by_stripe_customer",
    stripeCustomerId,
  ]);
  if (!res.value) return null;
  return await getUserById(res.value);
}

export async function setUserSubscription(
  id: string,
  isSubscribed: boolean,
) {
  const key = ["users", id];
  const userRes = await kv.get<User>(key);

  if (userRes.value === null) throw new Error("User with ID does not exist");

  const res = await kv.atomic()
    .check(userRes)
    .set(key, { ...userRes.value, isSubscribed } as User)
    .commit();

  if (!res.ok) {
    throw new TypeError("Atomic operation has failed");
  }
}

export async function getOrCreateUser(id: string, email: string) {
  const user = await getUserById(id);
  if (user) return user;

  const customer = await stripe.customers.create({ email });
  return await createUser({ id, stripeCustomerId: customer.id });
}
