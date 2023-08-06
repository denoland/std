// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  assertIsEntry,
  Item,
  kv,
  newVoteProps,
  type Notification,
  User,
  Vote,
} from "@/utils/db.ts";

type OldItem = Omit<Item, "userLogin"> & { userId: string };
type OldUser = User & { id: string };

async function migrateVote(voterUserId: string, oldItem: OldItem) {
  const [creatorUserRes, voterUserRes] = await kv.getMany<OldUser[]>([
    ["users", oldItem.userId],
    ["users", voterUserId],
  ]);
  assertIsEntry(creatorUserRes);
  assertIsEntry(voterUserRes);

  const item: Item = {
    userLogin: creatorUserRes.value.login,
    id: oldItem.id,
    createdAt: oldItem.createdAt,
    title: oldItem.title,
    url: oldItem.url,
    score: oldItem.score,
  };
  const vote: Vote = {
    ...newVoteProps(),
    item,
    userLogin: voterUserRes.value.login,
  };

  const itemKey = ["items", vote.item.id];
  const itemsByTimeKey = [
    "items_by_time",
    vote.item.createdAt.getTime(),
    vote.item.id,
  ];
  const itemsByUserKey = ["items_by_user", vote.item.userLogin, vote.item.id];

  const votesKey = ["votes", vote.id];
  const votesByItemKey = ["votes_by_item", vote.item.id, vote.id];
  const votesByUserKey = ["votes_by_user", vote.userLogin, vote.id];

  const res = await kv.atomic()
    .set(itemKey, vote.item)
    .set(itemsByTimeKey, vote.item)
    .set(itemsByUserKey, vote.item)
    .set(votesKey, vote)
    .set(votesByItemKey, vote)
    .set(votesByUserKey, vote)
    .commit();

  if (!res.ok) throw new Error(`Failed to set vote: ${vote}`);
}

async function migrateItem(oldItem: OldItem) {
  const userRes = await kv.get<User>(["users", oldItem.userId]);
  assertIsEntry(userRes);

  const item: Item = {
    userLogin: userRes.value.login,
    id: oldItem.id,
    createdAt: oldItem.createdAt,
    title: oldItem.title,
    url: oldItem.url,
    score: oldItem.score,
  };

  const itemsKey = ["items", item.id];
  const itemsByTimeKey = ["items_by_time", item.createdAt.getTime(), item.id];
  const itemsByUserKey = ["items_by_user", userRes.value.login, item.id];
  const oldItemsByUserKey = ["items_by_user", oldItem.userId, item.id];

  const res = await kv.atomic()
    .set(itemsKey, item)
    .set(itemsByTimeKey, item)
    .set(itemsByUserKey, item)
    .delete(oldItemsByUserKey)
    .commit();

  if (!res.ok) throw new Error(`Failed to migrate item: ${item}`);
}

export async function migrateKv() {
  const promises1 = [];

  // Notifications
  const notificationsIter = kv.list<Notification>({
    prefix: ["notifications"],
  });
  for await (const entry of notificationsIter) {
    promises1.push(kv.delete(entry.key));
  }

  // Notifications by users
  const notificationsByUsersIter = kv.list<Notification>({
    prefix: ["notifications_by_user"],
  });
  for await (const entry of notificationsByUsersIter) {
    promises1.push(kv.delete(entry.key));
  }

  // Votes
  const votedItemsByUserIter = kv.list<OldItem>({
    prefix: ["voted_items_by_user"],
  });
  for await (const entry of votedItemsByUserIter) {
    promises1.push(migrateVote(entry.key[1].toString(), entry.value));
  }
  const values1 = await Promise.allSettled(promises1);
  console.log(values1.filter(({ status }) => status === "rejected"));

  // Items
  const promises2 = [];
  const itemsIter = kv.list<OldItem>({ prefix: ["items"] });
  for await (const entry of itemsIter) {
    if (entry.value.userId) {
      promises2.push(migrateItem(entry.value));
    }
  }
  const values2 = await Promise.allSettled(promises2);
  console.log(values2.filter(({ status }) => status === "rejected"));
  console.log("KV migration complete");
}

if (import.meta.main) {
  if (
    !confirm("Would you like to continue?")
  ) {
    close();
  }
  await migrateKv();
  await kv.close();
}
