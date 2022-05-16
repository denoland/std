import type { ConditionalArray, Raw, RedisValue } from "./protocol/mod.ts";

export interface XId {
  unixMs: number;
  seqNo: number;
}

export interface XMessage {
  xid: XId;
  fieldValues: Record<string, string>;
}

export interface XKeyId {
  key: string;
  xid: XIdInput;
}

export type XKeyIdLike = [string, XIdInput];

export interface XKeyIdGroup {
  key: string;
  xid: XIdGroupRead;
}

export type XKeyIdGroupLike = [string, XIdGroupRead];

export type XReadStream = { key: string; messages: XMessage[] };
export type XReadReply = XReadStream[];

// basic data returned by redis
export type XReadIdData = [string, string[]];
export type XReadStreamRaw = [string, XReadIdData[]];
export type XReadReplyRaw = XReadStreamRaw[];

/** Flexible input type for commands which require message
 * ID to be passed (represented in lower-level Redis API as
 * "1000-0" etc).
 *
 * We also include an array format for ease of use, where
 * the first element is the epochMillis, second is seqNo.
 *
 * We also allow passing a single number,
 * which will represent the the epoch Millis with
 * seqNo of zero.  (Especially useful is to pass 0.)
 */
export type XIdInput =
  | XId
  | [number, number]
  | number;
/**
 * ID input type for XADD, which is allowed to include the
 * "*" operator. */
export type XIdAdd = XIdInput | "*";
/**
 * ID input type for XGROUPREAD, which is allowed to include
 * the ">" operator.  We include an array format for ease of
 * use, where the first element is the epochMillis, second
 * is seqNo. */
export type XIdGroupRead = XIdInput | ">";

/** Allows special maximum ID for XRANGE and XREVRANGE */
export type XIdPos = XIdInput | "+";
/** Allows special minimum ID for XRANGE and XREVRANGE */
export type XIdNeg = XIdInput | "-";
/** Allow special $ ID for XGROUP CREATE */
export type XIdCreateGroup = XIdInput | "$";

export type XAddFieldValues =
  | Record<string | number, RedisValue>
  | Map<string | number, RedisValue>;

export interface XReadOpts {
  count?: number;
  block?: number;
}

export interface XReadGroupOpts {
  group: string;
  consumer: string;
  count?: number;
  block?: number;
}

export interface XMaxlen {
  approx?: boolean;
  elements: number;
}

export type XClaimReply = XClaimMessages | XClaimJustXId;
export interface XClaimMessages {
  kind: "messages";
  messages: XMessage[];
}
export interface XClaimJustXId {
  kind: "justxid";
  xids: XId[];
}

/**
 * @param count Limit on the number of messages to return per call.
 * @param startId ID for the first pending record.
 * @param endId  ID for the final pending record.
 * @param consumers  Every consumer in the consumer group
 * with at least one pending message, and the number of
 * pending messages it has.
 */
export interface XPendingReply {
  count: number;
  startId: XId;
  endId: XId;
  consumers: XPendingConsumer[];
}
export interface XPendingConsumer {
  name: string;
  pending: number;
}

/**
 * Represents a pending message parsed from xpending.
 *
 * @param id The ID of the message
 * @param consumer The name of the consumer that fetched the message
 *  and has still to acknowledge it. We call it the
 *  current owner of the message.
 * @param lastDeliveredMs The number of milliseconds that elapsed since the
 *  last time this message was delivered to this consumer.
 * @param timesDelivered The number of times this message was delivered.
 */
export interface XPendingCount {
  xid: XId;
  owner: string;
  lastDeliveredMs: number;
  timesDelivered: number;
}
/** Used in the XPENDING command, all three of these
 * args must be specified if _any_ are specified.
 */
export interface StartEndCount {
  start: number | "-";
  end: number | "+";
  count: number;
}

export interface XInfoStreamReply {
  length: number;
  radixTreeKeys: number;
  radixTreeNodes: number;
  groups: number;
  lastGeneratedId: XId;
  firstEntry: XMessage;
  lastEntry: XMessage;
}

export interface XInfoStreamFullReply {
  length: number;
  radixTreeKeys: number;
  radixTreeNodes: number;
  lastGeneratedId: XId;
  entries: XMessage[];
  groups: XGroupDetail[];
}

/**
 * Child of the return type for xinfo_stream_full
 */
export interface XGroupDetail {
  name: string;
  lastDeliveredId: XId;
  pelCount: number;
  pending: XPendingCount[];
  consumers: XConsumerDetail[];
}
/** Child of XINFO STREAMS FULL response */
export interface XConsumerDetail {
  name: string;
  seenTime: number;
  pelCount: number;
  pending: { xid: XId; lastDeliveredMs: number; timesDelivered: number }[];
}

export type XInfoConsumersReply = XInfoConsumer[];
/**
 * A consumer parsed from xinfo command.
 *
 * @param name Name of the consumer group.
 * @param pending Number of pending messages for this specific consumer.
 * @param idle This consumer's idle time in milliseconds.
 */
export interface XInfoConsumer {
  name: string;
  pending: number;
  idle: number;
}

/** Response to XINFO GROUPS <key> */
export type XInfoGroupsReply = XInfoGroup[];
export interface XInfoGroup {
  name: string;
  consumers: number;
  pending: number;
  lastDeliveredId: XId;
}

export interface XClaimOpts {
  group: string;
  consumer: string;
  minIdleTime: number;
  idle?: number;
  time?: number;
  retryCount?: number;
  force?: boolean;
  justXId?: boolean;
}

export function parseXMessage(
  raw: XReadIdData,
): XMessage {
  const fieldValues: Record<string, string> = {};
  let f: string | undefined = undefined;

  let m = 0;
  for (const data of raw[1]) {
    if (m % 2 === 0) {
      f = data;
    } else if (f) {
      fieldValues[f] = data;
    }
    m++;
  }

  return { xid: parseXId(raw[0]), fieldValues: fieldValues };
}

export function convertMap(raw: ConditionalArray): Map<string, Raw> {
  const fieldValues: Map<string, Raw> = new Map();
  let f: string | undefined = undefined;

  let m = 0;
  for (const data of raw) {
    if (m % 2 === 0 && typeof data === "string") {
      f = data;
    } else if (m % 2 === 1 && f) {
      fieldValues.set(f, data);
    }
    m++;
  }

  return fieldValues;
}

export function parseXReadReply(
  raw: XReadReplyRaw,
): XReadReply {
  const out: XReadStream[] = [];
  for (const [key, idData] of raw) {
    const messages = [];
    for (const rawMsg of idData) {
      messages.push(parseXMessage(rawMsg));
    }
    out.push({ key, messages });
  }

  return out;
}

export function parseXId(raw: string): XId {
  const [ms, sn] = raw.split("-");
  return { unixMs: parseInt(ms), seqNo: parseInt(sn) };
}

export function parseXPendingConsumers(
  raws: ConditionalArray,
): XPendingConsumer[] {
  const out: XPendingConsumer[] = [];

  for (const raw of raws) {
    if (isCondArray(raw) && isString(raw[0]) && isString(raw[1])) {
      out.push({ name: raw[0], pending: parseInt(raw[1]) });
    }
  }

  return out;
}

export function parseXPendingCounts(raw: ConditionalArray): XPendingCount[] {
  const infos: XPendingCount[] = [];
  for (const r of raw) {
    if (
      isCondArray(r) && isString(r[0]) &&
      isString(r[1]) && isNumber(r[2]) &&
      isNumber(r[3])
    ) {
      infos.push(
        {
          xid: parseXId(r[0]),
          owner: r[1],
          lastDeliveredMs: r[2],
          timesDelivered: r[3],
        },
      );
    }
  }

  return infos;
}

export function parseXGroupDetail(rawGroups: ConditionalArray): XGroupDetail[] {
  const out = [];

  for (const rawGroup of rawGroups) {
    if (isCondArray(rawGroup)) {
      const data = convertMap(rawGroup);

      // array of arrays
      const consDeets = data.get("consumers") as ConditionalArray[];

      out.push(
        {
          name: rawstr(data.get("name")),
          lastDeliveredId: parseXId(rawstr(data.get("last-delivered-id"))),
          pelCount: rawnum(data.get("pel-count")),
          pending: parseXPendingCounts(
            data.get("pending") as ConditionalArray,
          ),
          consumers: parseXConsumerDetail(
            consDeets,
          ),
        },
      );
    }
  }

  return out;
}

export function parseXConsumerDetail(
  nestedRaws: Raw[][],
): XConsumerDetail[] {
  const out: XConsumerDetail[] = [];

  for (const raws of nestedRaws) {
    const data = convertMap(raws);

    const pending = (data.get("pending") as [string, number, number][]).map(
      (p) => {
        return {
          xid: parseXId(rawstr(p[0])),
          lastDeliveredMs: rawnum(p[1]),
          timesDelivered: rawnum(p[2]),
        };
      },
    );

    const r = {
      name: rawstr(data.get("name")),
      seenTime: rawnum(data.get("seen-time")),
      pelCount: rawnum(data.get("pel-count")),
      pending,
    };

    out.push(r);
  }

  return out;
}

export function xidstr(
  xid: XIdAdd | XIdNeg | XIdPos | XIdCreateGroup | XIdGroupRead,
) {
  if (typeof xid === "string") return xid;
  if (typeof xid === "number") return `${xid}-0`;
  if (xid instanceof Array && xid.length > 1) return `${xid[0]}-${xid[1]}`;
  if (isXId(xid)) return `${xid.unixMs}-${xid.seqNo}`;
  throw "fail";
}

export function rawnum(raw: Raw): number {
  return raw ? +raw.toString() : 0;
}
export function rawstr(raw: Raw): string {
  return raw ? raw.toString() : "";
}
// deno-lint-ignore no-explicit-any
export function isString(x: any): x is string {
  return typeof x === "string";
}

// deno-lint-ignore no-explicit-any
export function isNumber(x: any): x is number {
  return typeof x === "number";
}

export function isCondArray(x: Raw): x is ConditionalArray {
  const l = (x as ConditionalArray).length;
  if (l > 0 || l < 1) return true;
  else return false;
}

function isXId(xid: XIdAdd): xid is XId {
  return (xid as XId).unixMs !== undefined;
}
