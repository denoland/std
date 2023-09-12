// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { type Item } from "@/utils/db.ts";
import { LINK_STYLES } from "@/utils/constants.ts";
import IconInfo from "tabler_icons_tsx/info-circle.tsx";
import { fetchValues } from "@/utils/http.ts";
import { decodeTime } from "std/ulid/mod.ts";
import { timeAgo } from "@/utils/display.ts";
import GitHubAvatarImg from "@/components/GitHubAvatarImg.tsx";

async function fetchVotedItems() {
  const url = "/api/me/votes";
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Request failed: GET ${url}`);
  return await resp.json() as Item[];
}

function EmptyItemsList() {
  return (
    <>
      <div class="flex flex-col justify-center items-center gap-2">
        <div class="flex flex-col items-center gap-2 pt-16">
          <IconInfo class="w-10 h-10 text-gray-400 dark:text-gray-600" />
          <p class="text-center font-medium">No items found</p>
        </div>

        <a
          href="/submit"
          class="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-primary hover:underline"
        >
          Submit your project
        </a>
      </div>
    </>
  );
}

interface StaticVoteButton {
  /** Number of votes for the item */
  score: number;
}

function StaticVoteButton(props: StaticVoteButton) {
  return (
    <a
      class="text-inherit pr-2 text-center"
      title="Sign in to vote"
      href="/signin"
    >
      ▲
      <br />
      {props.score}
    </a>
  );
}

interface VoteButtonProps {
  item: Item;
  /** Whether the item has been voted-for by the signed-in user */
  isVoted: boolean;
}

function VoteButton(props: VoteButtonProps) {
  const isVoted = useSignal(props.isVoted);
  const score = useSignal(props.item.score);
  const url = `/api/items/${props.item.id}/vote`;

  async function onClick(event: MouseEvent) {
    if (event.detail !== 1) return;
    const method = isVoted.value ? "DELETE" : "POST";
    const resp = await fetch(url, { method });

    if (resp.status === 401) {
      window.location.href = "/signin";
      return;
    }
    if (!resp.ok) throw new Error(`Request failed: ${method} ${url}`);

    isVoted.value = !isVoted.value;
    method === "POST" ? score.value++ : score.value--;
  }

  return (
    <button
      class={(isVoted.value ? "text-primary" : "text-inherit") +
        " pr-2 text-center"}
      onClick={onClick}
    >
      ▲
      <br />
      {score}
    </button>
  );
}

interface ItemSummaryProps {
  item: Item;
  /** Whether the item has been voted-for by the signed-in user */
  isVoted: boolean;
  /** Whether the user is signed-in */
  isSignedIn: boolean;
}

function ItemSummary(props: ItemSummaryProps) {
  let createdTimeAgo: string;

  try {
    createdTimeAgo = timeAgo(new Date(decodeTime(props.item.id)));
  } catch (err) {
    // @ts-ignore old items, which still have a `uuid`, also have a `createdAt` property
    createdTimeAgo = timeAgo(new Date(props.item?.createdAt));
  }

  return (
    <div class="py-2 flex gap-4">
      {props.isSignedIn
        ? (
          <VoteButton
            item={props.item}
            isVoted={props.isVoted}
          />
        )
        : <StaticVoteButton score={props.item.score} />}
      <div class="space-y-1">
        <p>
          <a
            class="visited:(text-[purple] dark:text-[lightpink]) hover:underline mr-4"
            href={props.item.url}
          >
            {props.item.title}
          </a>
          <a
            class="hover:underline text-gray-500 after:content-['_↗']"
            href={props.item.url}
            target="_blank"
          >
            {new URL(props.item.url).host}
          </a>
        </p>
        <p class="text-gray-500">
          <GitHubAvatarImg
            login={props.item.userLogin}
            size={24}
            class="mr-2"
          />
          <a class="hover:underline" href={`/users/${props.item.userLogin}`}>
            {props.item.userLogin}
          </a>{" "}
          {createdTimeAgo}
        </p>
      </div>
    </div>
  );
}

export interface ItemsListProps {
  /** Endpoint URL of the REST API to make the fetch request to */
  endpoint: string;
  /** Whether the user is signed-in */
  isSignedIn: boolean;
}

export default function ItemsList(props: ItemsListProps) {
  const itemsSig = useSignal<Item[]>([]);
  const votedItemsIdsSig = useSignal<string[]>([]);
  const cursorSig = useSignal("");
  const isLoadingSig = useSignal<boolean | undefined>(undefined);
  const itemsAreVotedSig = useComputed(() =>
    itemsSig.value.map((item) => votedItemsIdsSig.value.includes(item.id))
  );

  async function loadMoreItems() {
    if (isLoadingSig.value) return;
    isLoadingSig.value = true;
    try {
      const { values, cursor } = await fetchValues<Item>(
        props.endpoint,
        cursorSig.value,
      );
      itemsSig.value = [...itemsSig.value, ...values];
      cursorSig.value = cursor;
    } catch (error) {
      console.error(error.message);
    } finally {
      isLoadingSig.value = false;
    }
  }

  useEffect(() => {
    if (!props.isSignedIn) {
      loadMoreItems();
      return;
    }

    fetchVotedItems()
      .then((votedItems) =>
        votedItemsIdsSig.value = votedItems.map(({ id }) => id)
      )
      .finally(() => loadMoreItems());
  }, []);

  if (isLoadingSig.value === undefined) {
    return <p class={LINK_STYLES}>Loading...</p>;
  }

  return (
    <div>
      {itemsSig.value.length
        ? itemsSig.value.map((item, id) => {
          return (
            <ItemSummary
              key={item.id}
              item={item}
              isVoted={itemsAreVotedSig.value[id]}
              isSignedIn={props.isSignedIn}
            />
          );
        })
        : <EmptyItemsList />}
      {cursorSig.value !== "" && (
        <button onClick={loadMoreItems} class={LINK_STYLES}>
          {isLoadingSig.value ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
