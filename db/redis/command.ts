import type {
  Binary,
  Bulk,
  BulkNil,
  BulkString,
  ConditionalArray,
  Integer,
  Raw,
  RedisValue,
  SimpleString,
} from "./protocol/mod.ts";
import type { RedisPipeline } from "./pipeline.ts";
import type { RedisSubscription } from "./pubsub.ts";
import type {
  StartEndCount,
  XAddFieldValues,
  XClaimOpts,
  XClaimReply,
  XId,
  XIdAdd,
  XIdInput,
  XIdNeg,
  XIdPos,
  XInfoConsumersReply,
  XInfoGroupsReply,
  XInfoStreamFullReply,
  XInfoStreamReply,
  XKeyId,
  XKeyIdGroup,
  XKeyIdGroupLike,
  XKeyIdLike,
  XMaxlen,
  XMessage,
  XPendingCount,
  XPendingReply,
  XReadGroupOpts,
  XReadOpts,
  XReadReply,
} from "./stream.ts";

export type ACLLogMode = "RESET";
type BitopOperation = "AND" | "OR" | "XOR" | "NOT";

export interface BitfieldOpts {
  get?: { type: string; offset: number | string };
  set?: { type: string; offset: number | string; value: number };
  incrby?: { type: string; offset: number | string; increment: number };
}

export interface BitfieldWithOverflowOpts extends BitfieldOpts {
  overflow: "WRAP" | "SAT" | "FAIL";
}

export type ClientCachingMode = "YES" | "NO";

export interface ClientKillOpts {
  addr?: string; // ip:port
  laddr?: string; // ip:port
  id?: number;
  type?: ClientType;
  user?: string;
  skipme?: "YES" | "NO";
}

export interface ClientListOpts {
  type?: ClientType;
  ids?: number[];
}

export type ClientPauseMode = "WRITE" | "ALL";

export interface ClientTrackingOpts {
  mode: "ON" | "OFF";
  redirect?: number;
  prefixes?: string[];
  bcast?: boolean;
  optIn?: boolean;
  optOut?: boolean;
  noLoop?: boolean;
}

export type ClientType = "NORMAL" | "MASTER" | "REPLICA" | "PUBSUB";
export type ClientUnblockingBehaviour = "TIMEOUT" | "ERROR";

export type ClusterFailoverMode = "FORCE" | "TAKEOVER";
export type ClusterResetMode = "HARD" | "SOFT";
export type ClusterSetSlotSubcommand =
  | "IMPORTING"
  | "MIGRATING"
  | "NODE"
  | "STABLE";

export interface MigrateOpts {
  copy?: boolean;
  replace?: boolean;
  auth?: string;
  keys?: string[];
}

export interface RestoreOpts {
  replace?: boolean;
  absttl?: boolean;
  idletime?: number;
  freq?: number;
}

export interface StralgoOpts {
  idx?: boolean;
  len?: boolean;
  minmatchlen?: number;
  withmatchlen?: boolean;
}

export type StralgoAlgorithm = "LCS";
export type StralgoTarget = "KEYS" | "STRINGS";

export interface SetOpts {
  ex?: number;
  px?: number;
  keepttl?: boolean;
}

export interface SetWithModeOpts extends SetOpts {
  mode: "NX" | "XX";
}

export interface GeoRadiusOpts {
  withCoord?: boolean;
  withDist?: boolean;
  withHash?: boolean;
  count?: number;
  sort?: "ASC" | "DESC";
  store?: string;
  storeDist?: string;
}

export type GeoUnit = "m" | "km" | "ft" | "mi";

interface BaseScanOpts {
  pattern?: string;
  count?: number;
}

export interface ScanOpts extends BaseScanOpts {
  type?: string;
}

export type HScanOpts = BaseScanOpts;
export type SScanOpts = BaseScanOpts;
export type ZScanOpts = BaseScanOpts;

export interface ZAddOpts {
  mode?: "NX" | "XX";
  ch?: boolean;
}

interface ZStoreOpts {
  aggregate?: "SUM" | "MIN" | "MAX";
}

export type ZInterstoreOpts = ZStoreOpts;
export type ZUnionstoreOpts = ZStoreOpts;

export interface ZRangeOpts {
  withScore?: boolean;
}

export interface ZRangeByLexOpts {
  limit?: { offset: number; count: number };
}

export interface ZRangeByScoreOpts {
  withScore?: boolean;
  limit?: { offset: number; count: number };
}

interface BaseLPosOpts {
  rank?: number;
  maxlen?: number;
}

export interface LPosOpts extends BaseLPosOpts {
  count?: null | undefined;
}

export interface LPosWithCountOpts extends BaseLPosOpts {
  count: number;
}

export type LInsertLocation = "BEFORE" | "AFTER";

export interface MemoryUsageOpts {
  samples?: number;
}

type RoleReply =
  | ["master", Integer, BulkString[][]]
  | ["slave", BulkString, Integer, BulkString, Integer]
  | ["sentinel", BulkString[]];

export type ScriptDebugMode = "YES" | "SYNC" | "NO";

export interface SortOpts {
  by?: string;
  limit?: { offset: number; count: number };
  patterns?: string[];
  order?: "ASC" | "DESC";
  alpha?: boolean;
}

export interface SortWithDestinationOpts extends SortOpts {
  destination: string;
}

export type ShutdownMode = "NOSAVE" | "SAVE";

export interface RedisCommands {
  // Connection
  auth(password: string): Promise<SimpleString>;
  auth(username: string, password: string): Promise<SimpleString>;
  echo(message: RedisValue): Promise<BulkString>;
  ping(): Promise<SimpleString>;
  ping(message: RedisValue): Promise<BulkString>;
  quit(): Promise<SimpleString>;
  select(index: number): Promise<SimpleString>;

  // Keys
  del(...keys: string[]): Promise<Integer>;
  dump(key: string): Promise<Binary | BulkNil>;
  exists(...keys: string[]): Promise<Integer>;
  expire(key: string, seconds: number): Promise<Integer>;
  expireat(key: string, timestamp: string): Promise<Integer>;
  keys(pattern: string): Promise<BulkString[]>;
  migrate(
    host: string,
    port: number | string,
    key: string,
    destination_db: string,
    timeout: number,
    opts?: MigrateOpts,
  ): Promise<SimpleString>;
  move(key: string, db: string): Promise<Integer>;
  objectRefCount(key: string): Promise<Integer | BulkNil>;
  objectEncoding(key: string): Promise<Bulk>;
  objectIdletime(key: string): Promise<Integer | BulkNil>;
  objectFreq(key: string): Promise<Integer | BulkNil>;
  objectHelp(): Promise<BulkString[]>;
  persist(key: string): Promise<Integer>;
  pexpire(key: string, milliseconds: number): Promise<Integer>;
  pexpireat(key: string, milliseconds_timestamp: number): Promise<Integer>;
  pttl(key: string): Promise<Integer>;
  randomkey(): Promise<Bulk>;
  rename(key: string, newkey: string): Promise<SimpleString>;
  renamenx(key: string, newkey: string): Promise<Integer>;
  restore(
    key: string,
    ttl: number,
    serialized_value: Binary,
    opts?: RestoreOpts,
  ): Promise<SimpleString>;
  scan(
    cursor: number,
    opts?: ScanOpts,
  ): Promise<[BulkString, BulkString[]]>;
  sort(
    key: string,
    opts?: SortOpts,
  ): Promise<BulkString[]>;
  sort(
    key: string,
    opts?: SortWithDestinationOpts,
  ): Promise<Integer>;
  touch(...keys: string[]): Promise<Integer>;
  ttl(key: string): Promise<Integer>;
  type(key: string): Promise<SimpleString>;
  unlink(...keys: string[]): Promise<Integer>;
  wait(numreplicas: number, timeout: number): Promise<Integer>;

  // String
  append(key: string, value: RedisValue): Promise<Integer>;
  bitcount(key: string): Promise<Integer>;
  bitcount(key: string, start: number, end: number): Promise<Integer>;
  bitfield(
    key: string,
    opts?: BitfieldOpts,
  ): Promise<Integer[]>;
  bitfield(
    key: string,
    opts?: BitfieldWithOverflowOpts,
  ): Promise<(Integer | BulkNil)[]>;
  bitop(
    operation: BitopOperation,
    destkey: string,
    ...keys: string[]
  ): Promise<Integer>;
  bitpos(
    key: string,
    bit: number,
    start?: number,
    end?: number,
  ): Promise<Integer>;
  decr(key: string): Promise<Integer>;
  decrby(key: string, decrement: number): Promise<Integer>;
  get(key: string): Promise<Bulk>;
  getbit(key: string, offset: number): Promise<Integer>;
  getrange(key: string, start: number, end: number): Promise<BulkString>;
  getset(key: string, value: RedisValue): Promise<Bulk>;
  incr(key: string): Promise<Integer>;
  incrby(key: string, increment: number): Promise<Integer>;
  incrbyfloat(key: string, increment: number): Promise<BulkString>;
  mget(...keys: string[]): Promise<Bulk[]>;
  mset(key: string, value: RedisValue): Promise<SimpleString>;
  mset(...key_values: [string, RedisValue][]): Promise<SimpleString>;
  mset(key_values: Record<string, RedisValue>): Promise<SimpleString>;
  msetnx(key: string, value: RedisValue): Promise<Integer>;
  msetnx(...key_values: [string, RedisValue][]): Promise<Integer>;
  msetnx(key_values: Record<string, RedisValue>): Promise<Integer>;
  psetex(
    key: string,
    milliseconds: number,
    value: RedisValue,
  ): Promise<SimpleString>;
  set(
    key: string,
    value: RedisValue,
    opts?: SetOpts,
  ): Promise<SimpleString>;
  set(
    key: string,
    value: RedisValue,
    opts?: SetWithModeOpts,
  ): Promise<SimpleString | BulkNil>;
  setbit(key: string, offset: number, value: RedisValue): Promise<Integer>;
  setex(key: string, seconds: number, value: RedisValue): Promise<SimpleString>;
  setnx(key: string, value: RedisValue): Promise<Integer>;
  setrange(key: string, offset: number, value: RedisValue): Promise<Integer>;
  stralgo(
    algorithm: StralgoAlgorithm,
    target: StralgoTarget,
    a: string,
    b: string,
    opts?: StralgoOpts,
  ): Promise<Bulk>;
  strlen(key: string): Promise<Integer>;

  // Geo
  geoadd(
    key: string,
    longitude: number,
    latitude: number,
    member: string,
  ): Promise<Integer>;
  geoadd(
    key: string,
    ...lng_lat_members: [number, number, string][]
  ): Promise<Integer>;
  geoadd(
    key: string,
    member_lng_lats: Record<string, [number, number]>,
  ): Promise<Integer>;
  geohash(key: string, ...members: string[]): Promise<Bulk[]>;
  geopos(
    key: string,
    ...members: string[]
  ): Promise<([BulkString, BulkString] | BulkNil)[]>;
  geodist(
    key: string,
    member1: string,
    member2: string,
    unit?: "m" | "km" | "ft" | "mi",
  ): Promise<Bulk>;
  // FIXME: Return type is too conditional
  georadius(
    key: string,
    longitude: number,
    latitude: number,
    radius: number,
    unit: GeoUnit,
    opts?: GeoRadiusOpts,
  ): Promise<ConditionalArray>;
  // FIXME: Return type is too conditional
  georadiusbymember(
    key: string,
    member: string,
    radius: number,
    unit: GeoUnit,
    opts?: GeoRadiusOpts,
  ): Promise<ConditionalArray>;

  // Hash
  hdel(key: string, ...fields: string[]): Promise<Integer>;
  hexists(key: string, field: string): Promise<Integer>;
  hget(key: string, field: string): Promise<Bulk>;
  hgetall(key: string): Promise<BulkString[]>;
  hincrby(key: string, field: string, increment: number): Promise<Integer>;
  hincrbyfloat(
    key: string,
    field: string,
    increment: number,
  ): Promise<BulkString>;
  hkeys(key: string): Promise<BulkString[]>;
  hlen(key: string): Promise<Integer>;
  hmget(key: string, ...fields: string[]): Promise<Bulk[]>;
  /**
   * @deprecated since 4.0.0, use hset
   */
  hmset(key: string, field: string, value: RedisValue): Promise<SimpleString>;
  /**
   * @deprecated since 4.0.0, use hset
   */
  hmset(
    key: string,
    ...field_values: [string, RedisValue][]
  ): Promise<SimpleString>;
  /**
   * @deprecated since 4.0.0, use hset
   */
  hmset(
    key: string,
    field_values: Record<string, RedisValue>,
  ): Promise<SimpleString>;
  hscan(
    key: string,
    cursor: number,
    opts?: HScanOpts,
  ): Promise<[BulkString, BulkString[]]>;

  /**
   * @description Sets `field` in the hash to `value`.
   * @see https://redis.io/commands/hset
   */
  hset(key: string, field: string, value: RedisValue): Promise<Integer>;

  /**
   * @description Sets the field-value pairs specified by `fieldValues` to the hash stored at `key`.
   *   NOTE: Variadic form for `HSET` is supported only in Redis v4.0.0 or higher.
   */
  hset(key: string, ...fieldValues: [string, RedisValue][]): Promise<Integer>;

  /**
   * @description Sets the field-value pairs specified by `fieldValues` to the hash stored at `key`.
   *   NOTE: Variadic form for `HSET` is supported only in Redis v4.0.0 or higher.
   */
  hset(key: string, fieldValues: Record<string, RedisValue>): Promise<Integer>;
  hsetnx(key: string, field: string, value: RedisValue): Promise<Integer>;
  hstrlen(key: string, field: string): Promise<Integer>;
  hvals(key: string): Promise<BulkString[]>;

  // List
  blpop(
    timeout: number,
    ...keys: string[]
  ): Promise<[BulkString, BulkString] | []>;
  brpop(
    timeout: number,
    ...keys: string[]
  ): Promise<[BulkString, BulkString] | []>;
  brpoplpush(
    source: string,
    destination: string,
    timeout: number,
  ): Promise<Bulk>;
  lindex(key: string, index: number): Promise<Bulk>;
  linsert(
    key: string,
    loc: LInsertLocation,
    pivot: string,
    value: RedisValue,
  ): Promise<Integer>;
  llen(key: string): Promise<Integer>;
  lpop(key: string): Promise<Bulk>;

  /**
   * Returns the index of the first matching element inside a list.
   * If no match is found, this method returns `undefined`.
   */
  lpos(
    key: string,
    element: RedisValue,
    opts?: LPosOpts,
  ): Promise<Integer | BulkNil>;

  /**
   * Returns the indexes of the first N matching elements inside a list.
   * If no match is found. this method returns an empty array.
   *
   * @param opts.count Maximum length of the indices returned by this method
   */
  lpos(
    key: string,
    element: RedisValue,
    opts: LPosWithCountOpts,
  ): Promise<Integer[]>;

  lpush(key: string, ...elements: RedisValue[]): Promise<Integer>;
  lpushx(key: string, ...elements: RedisValue[]): Promise<Integer>;
  lrange(key: string, start: number, stop: number): Promise<BulkString[]>;
  lrem(key: string, count: number, element: RedisValue): Promise<Integer>;
  lset(key: string, index: number, element: RedisValue): Promise<SimpleString>;
  ltrim(key: string, start: number, stop: number): Promise<SimpleString>;
  rpop(key: string): Promise<Bulk>;
  rpoplpush(source: string, destination: string): Promise<Bulk>;
  rpush(key: string, ...elements: RedisValue[]): Promise<Integer>;
  rpushx(key: string, ...elements: RedisValue[]): Promise<Integer>;

  // HyperLogLog
  pfadd(key: string, ...elements: string[]): Promise<Integer>;
  pfcount(...keys: string[]): Promise<Integer>;
  pfmerge(destkey: string, ...sourcekeys: string[]): Promise<SimpleString>;

  // PubSub
  psubscribe<TMessage extends string | string[] = string>(
    ...patterns: string[]
  ): Promise<RedisSubscription<TMessage>>;
  pubsubChannels(pattern?: string): Promise<BulkString[]>;
  pubsubNumsub(...channels: string[]): Promise<(BulkString | Integer)[]>;
  pubsubNumpat(): Promise<Integer>;
  publish(channel: string, message: RedisValue): Promise<Integer>;
  subscribe<TMessage extends string | string[] = string>(
    ...channels: string[]
  ): Promise<RedisSubscription<TMessage>>;

  // Set
  sadd(key: string, ...members: RedisValue[]): Promise<Integer>;
  scard(key: string): Promise<Integer>;
  sdiff(...keys: string[]): Promise<BulkString[]>;
  sdiffstore(destination: string, ...keys: string[]): Promise<Integer>;
  sinter(...keys: string[]): Promise<BulkString[]>;
  sinterstore(destination: string, ...keys: string[]): Promise<Integer>;
  sismember(key: string, member: RedisValue): Promise<Integer>;
  smembers(key: string): Promise<BulkString[]>;
  smove(
    source: string,
    destination: string,
    member: RedisValue,
  ): Promise<Integer>;
  spop(key: string): Promise<Bulk>;
  spop(key: string, count: number): Promise<BulkString[]>;
  srandmember(key: string): Promise<Bulk>;
  srandmember(key: string, count: number): Promise<BulkString[]>;
  srem(key: string, ...members: RedisValue[]): Promise<Integer>;
  sscan(
    key: string,
    cursor: number,
    opts?: SScanOpts,
  ): Promise<[BulkString, BulkString[]]>;
  sunion(...keys: string[]): Promise<BulkString[]>;
  sunionstore(destination: string, ...keys: string[]): Promise<Integer>;

  // Stream
  /**
   * The XACK command removes one or multiple messages
   * from the pending entries list (PEL) of a stream
   *  consumer group. A message is pending, and as such
   *  stored inside the PEL, when it was delivered to
   * some consumer, normally as a side effect of calling
   *  XREADGROUP, or when a consumer took ownership of a
   *  message calling XCLAIM. The pending message was
   * delivered to some consumer but the server is yet not
   *  sure it was processed at least once. So new calls
   *  to XREADGROUP to grab the messages history for a
   * consumer (for instance using an XId of 0), will
   * return such message. Similarly the pending message
   * will be listed by the XPENDING command, that
   * inspects the PEL.
   *
   * Once a consumer successfully processes a message,
   * it should call XACK so that such message does not
   * get processed again, and as a side effect, the PEL
   * entry about this message is also purged, releasing
   * memory from the Redis server.
   *
   * @param key the stream key
   * @param group the group name
   * @param xids the ids to acknowledge
   */
  xack(key: string, group: string, ...xids: XIdInput[]): Promise<Integer>;
  /**
   * Write a message to a stream.
   *
   * Returns bulk string reply, specifically:
   * The command returns the XId of the added entry.
   * The XId is the one auto-generated if * is passed
   * as XId argument, otherwise the command just returns
   *  the same XId specified by the user during insertion.
   * @param key  write to this stream
   * @param xid the XId of the entity written to the stream
   * @param field_values  record object or map of field value pairs
   */
  xadd(
    key: string,
    xid: XIdAdd,
    field_values: XAddFieldValues,
  ): Promise<XId>;
  /**
   * Write a message to a stream.
   *
   * Returns bulk string reply, specifically:
   * The command returns the XId of the added entry.
   * The XId is the one auto-generated if * is passed
   * as XId argument, otherwise the command just returns
   *  the same XId specified by the user during insertion.
   * @param key  write to this stream
   * @param xid the XId of the entity written to the stream
   * @param field_values  record object or map of field value pairs
   * @param maxlen  number of elements, and whether or not to use an approximate comparison
   */
  xadd(
    key: string,
    xid: XIdAdd,
    field_values: XAddFieldValues,
    maxlen: XMaxlen,
  ): Promise<XId>;
  /**
   * In the context of a stream consumer group, this command changes the ownership of a pending message, so that the new owner is the
   * consumer specified as the command argument.
   *
   * It returns the claimed messages unless called with the JUSTIDs
   * option, in which case it returns only their XIds.
   *
   * This is a complex command!  Read more at https://redis.io/commands/xclaim
   *
<pre>
XCLAIM mystream mygroup Alice 3600000 1526569498055-0
1) 1) 1526569498055-0
   2) 1) "message"
      2) "orange"
</pre>

   * @param key the stream name
   * @param opts Various arguments for the command.  The following are required:
   *    GROUP: the name of the consumer group which will claim the messages
   *    CONSUMER: the specific consumer which will claim the message
   *    MIN-IDLE-TIME:  claim messages whose idle time is greater than this number (milliseconds)
   *
   * The command has multiple options which can be omitted, however
   * most are mainly for internal use in order to transfer the
   * effects of XCLAIM or other commands to the AOF file and to
   * propagate the same effects to the slaves, and are unlikely to
   * be useful to normal users:
   *    IDLE <ms>: Set the idle time (last time it was delivered) of the message. If IDLE is not specified, an IDLE of 0 is assumed, that is, the time count is reset because the message has now a new owner trying to process it.
   *    TIME <ms-unix-time>: This is the same as IDLE but instead of a relative amount of milliseconds, it sets the idle time to a specific Unix time (in milliseconds). This is useful in order to rewrite the AOF file generating XCLAIM commands.
   *    RETRYCOUNT <count>: Set the retry counter to the specified value. This counter is incremented every time a message is delivered again. Normally XCLAIM does not alter this counter, which is just served to clients when the XPENDING command is called: this way clients can detect anomalies, like messages that are never processed for some reason after a big number of delivery attempts.
   *    FORCE: Creates the pending message entry in the PEL even if certain specified XIds are not already in the PEL assigned to a different client. However the message must be exist in the stream, otherwise the XIds of non existing messages are ignored.
   *    JUSTXID: Return just an array of XIds of messages successfully claimed, without returning the actual message. Using this option means the retry counter is not incremented.
   * @param xids the message XIds to claim
   */
  xclaim(
    key: string,
    opts: XClaimOpts,
    ...xids: XIdInput[]
  ): Promise<XClaimReply>;
  /**
   * Removes the specified entries from a stream,
   * and returns the number of entries deleted,
   * that may be different from the number of
   * XIds passed to the command in case certain
   * XIds do not exist.
   *
   * @param key the stream key
   * @param xids ids to delete
   */
  xdel(key: string, ...xids: XIdInput[]): Promise<Integer>;
  /**
   * This command is used to create a new consumer group associated
   * with a stream.
   *
   * <pre>
   XGROUP CREATE test-man-000 test-group $ MKSTREAM
   OK
   </pre>
   *
   * See https://redis.io/commands/xgroup
   * @param key stream key
   * @param groupName the name of the consumer group
   * @param xid The last argument is the XId of the last
   *            item in the stream to consider already
   *            delivered. In the above case we used the
   *            special XId '$' (that means: the XId of the
   *            last item in the stream). In this case
   *            the consumers fetching data from that
   *            consumer group will only see new elements
   *            arriving in the stream.  If instead you
   *            want consumers to fetch the whole stream
   *            history, use zero as the starting XId for
   *            the consumer group
   * @param mkstream You can use the optional MKSTREAM subcommand as the last argument after the XId to automatically create the stream, if it doesn't exist. Note that if the stream is created in this way it will have a length of 0.
   */
  xgroupCreate(
    key: string,
    groupName: string,
    xid: XIdInput | "$",
    mkstream?: boolean,
  ): Promise<SimpleString>;
  /**
   * Delete a specific consumer from a group, leaving
   * the group itself intact.
   *
   * <pre>
XGROUP DELCONSUMER test-man-000 hellogroup 4
(integer) 0
</pre>
   * @param key stream key
   * @param groupName the name of the consumer group
   * @param consumerName the specific consumer to delete
   */
  xgroupDelConsumer(
    key: string,
    groupName: string,
    consumerName: string,
  ): Promise<Integer>;
  /**
   * Destroy a consumer group completely.  The consumer
   * group will be destroyed even if there are active
   * consumers and pending messages, so make sure to
   * call this command only when really needed.
   *
<pre>
XGROUP DESTROY test-man-000 test-group
(integer) 1
</pre>
   * @param key stream key
   * @param groupName the consumer group to destroy
   */
  xgroupDestroy(key: string, groupName: string): Promise<Integer>;
  /** A support command which displays text about the
   * various subcommands in XGROUP. */
  xgroupHelp(): Promise<BulkString>;
  /**
     * Finally it possible to set the next message to deliver
     * using the SETID subcommand. Normally the next XId is set
     * when the consumer is created, as the last argument of
     * XGROUP CREATE. However using this form the next XId can
     * be modified later without deleting and creating the
     * consumer group again. For instance if you want the
     * consumers in a consumer group to re-process all the
     * messages in a stream, you may want to set its next ID
     * to 0:
<pre>
XGROUP SETID mystream consumer-group-name 0
</pre>
     *
     * @param key  stream key
     * @param groupName   the consumer group
     * @param xid the XId to use for the next message delivered
     */
  xgroupSetID(
    key: string,
    groupName: string,
    xid: XIdInput,
  ): Promise<SimpleString>;
  xinfoStream(key: string): Promise<XInfoStreamReply>;
  /**
   *  returns the entire state of the stream, including entries, groups, consumers and PELs. This form is available since Redis 6.0.
   * @param key The stream key
   */
  xinfoStreamFull(key: string, count?: number): Promise<XInfoStreamFullReply>;
  /**
   * Get as output all the consumer groups associated
   * with the stream.
   *
   * @param key the stream key
   */
  xinfoGroups(key: string): Promise<XInfoGroupsReply>;
  /**
   * Get the list of every consumer in a specific
   * consumer group.
   *
   * @param key the stream key
   * @param group list consumers for this group
   */
  xinfoConsumers(key: string, group: string): Promise<XInfoConsumersReply>;
  /**
   * Returns the number of entries inside a stream. If the specified key does not exist the command returns zero, as if the stream was empty. However note that unlike other Redis types, zero-length streams are possible, so you should call TYPE or EXISTS in order to check if a key exists or not.
   * @param key  the stream key to inspect
   */
  xlen(key: string): Promise<Integer>;
  /**
   * Complex command to obtain info on messages in the Pending Entries List.
   *
   * Outputs a summary about the pending messages in a given consumer group.
   *
   * @param key get pending messages on this stream key
   * @param group get pending messages for this group
   */
  xpending(
    key: string,
    group: string,
  ): Promise<XPendingReply>;
  /**
   * Output more detailed info about pending messages:
   *
   *    - The ID of the message.
   *    - The name of the consumer that fetched the message and has still to acknowledge it. We call it the current owner of the message.
   *    - The number of milliseconds that elapsed since the last time this message was delivered to this consumer.
   *    - The number of times this message was delivered.
   *
   * If you pass the consumer argument to the command, it will efficiently filter for messages owned by that consumer.
   * @param key get pending messages on this stream key
   * @param group get pending messages for this group
   * @param startEndCount start and end: XId range params. you may specify "-" for start and "+" for end. you must also provide a max count of messages.
   * @param consumer optional, filter by this consumer as owner
   */
  xpendingCount(
    key: string,
    group: string,
    startEndCount: StartEndCount,
    consumer?: string,
  ): Promise<XPendingCount[]>;
  /**
   * The command returns the stream entries matching a given
   * range of XIds. The range is specified by a minimum and
   * maximum ID. All the entries having an XId between the
   * two specified or exactly one of the two XIds specified
   * (closed interval) are returned.
   *
   * The command also has a reciprocal command returning
   * items in the reverse order, called XREVRANGE, which
   * is otherwise identical.
   *
   * The - and + special XIds mean respectively the minimum
   * XId possible and the maximum XId possible inside a stream,
   * so the following command will just return every
   * entry in the stream.

<pre>
XRANGE somestream - +
</pre>
   * @param key  stream key
   * @param start beginning XId, or -
   * @param end  final XId, or +
   * @param count max number of entries to return
   */
  xrange(
    key: string,
    start: XIdNeg,
    end: XIdPos,
    count?: number,
  ): Promise<XMessage[]>;
  /**
   * This command is exactly like XRANGE, but with the
   * notable difference of returning the entries in
   * reverse order, and also taking the start-end range
   * in reverse order: in XREVRANGE you need to state the
   *  end XId and later the start ID, and the command will
   *  produce all the element between (or exactly like)
   * the two XIds, starting from the end side.
   *
   * @param key  the stream key
   * @param start   reading backwards, start from this XId.  for the maximum, specify "+"
   * @param end  stop at this XId.  for the minimum, specify "-"
   * @param count max number of entries to return
   */
  xrevrange(
    key: string,
    start: XIdPos,
    end: XIdNeg,
    count?: number,
  ): Promise<XMessage[]>;
  /**
   * Read data from one or multiple streams, only returning
   * entries with an XId greater than the last received XId
   * reported by the caller.
   * @param key_xids pairs containing the stream key, and
   *                    the XId from which to read
   * @param opts optional max count of entries to return
   *                    for each stream, and number of
   *                    milliseconds for which to block
   */
  xread(
    key_xids: (XKeyId | XKeyIdLike)[],
    opts?: XReadOpts,
  ): Promise<XReadReply>;
  /**
   * The XREADGROUP command is a special version of the XREAD command with support for consumer groups.
   *
   * @param key_ids { key, id } pairs to read
   * @param opts you must specify group name and consumer name.
   *              those must be created using the XGROUP command,
   *              prior to invoking this command.  you may optionally
   *              include a count of records to read, and the number
   *              of milliseconds to block
   */
  xreadgroup(
    key_xids: (XKeyIdGroup | XKeyIdGroupLike)[],
    opts: XReadGroupOpts,
  ): Promise<XReadReply>;

  /**
   * Trims the stream to the indicated number
   * of elements.
<pre>XTRIM mystream MAXLEN 1000</pre>
   * @param key
   * @param maxlen
   */
  xtrim(key: string, maxlen: XMaxlen): Promise<Integer>;

  // SortedSet
  bzpopmin(
    timeout: number,
    ...keys: string[]
  ): Promise<[BulkString, BulkString, BulkString] | []>;
  bzpopmax(
    timeout: number,
    ...keys: string[]
  ): Promise<[BulkString, BulkString, BulkString] | []>;
  zadd(
    key: string,
    score: number,
    member: RedisValue,
    opts?: ZAddOpts,
  ): Promise<Integer>;
  zadd(
    key: string,
    score_members: [number, RedisValue][],
    opts?: ZAddOpts,
  ): Promise<Integer>;
  zadd(
    key: string,
    member_scores: Record<string | number, number>,
    opts?: ZAddOpts,
  ): Promise<Integer>;
  zaddIncr(
    key: string,
    score: number,
    member: RedisValue,
    opts?: ZAddOpts,
  ): Promise<Bulk>;
  zcard(key: string): Promise<Integer>;
  zcount(key: string, min: number, max: number): Promise<Integer>;
  zincrby(
    key: string,
    increment: number,
    member: RedisValue,
  ): Promise<BulkString>;
  zinterstore(
    destination: string,
    keys: string[],
    opts?: ZInterstoreOpts,
  ): Promise<Integer>;
  zinterstore(
    destination: string,
    key_weights: [string, number][],
    opts?: ZInterstoreOpts,
  ): Promise<Integer>;
  zinterstore(
    destination: string,
    key_weights: Record<string, number>,
    opts?: ZInterstoreOpts,
  ): Promise<Integer>;
  zlexcount(key: string, min: string, max: string): Promise<Integer>;
  zpopmax(key: string, count?: number): Promise<BulkString[]>;
  zpopmin(key: string, count?: number): Promise<BulkString[]>;
  zrange(
    key: string,
    start: number,
    stop: number,
    opts?: ZRangeOpts,
  ): Promise<BulkString[]>;
  zrangebylex(
    key: string,
    min: string,
    max: string,
    opts?: ZRangeByLexOpts,
  ): Promise<BulkString[]>;
  zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
    opts?: ZRangeByScoreOpts,
  ): Promise<BulkString[]>;
  zrank(key: string, member: RedisValue): Promise<Integer | BulkNil>;
  zrem(key: string, ...members: RedisValue[]): Promise<Integer>;
  zremrangebylex(key: string, min: string, max: string): Promise<Integer>;
  zremrangebyrank(key: string, start: number, stop: number): Promise<Integer>;
  zremrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
  ): Promise<Integer>;
  zrevrange(
    key: string,
    start: number,
    stop: number,
    opts?: ZRangeOpts,
  ): Promise<BulkString[]>;
  zrevrangebylex(
    key: string,
    max: string,
    min: string,
    opts?: ZRangeByLexOpts,
  ): Promise<BulkString[]>;
  zrevrangebyscore(
    key: string,
    max: number | string,
    min: number | string,
    opts?: ZRangeByScoreOpts,
  ): Promise<BulkString[]>;
  zrevrank(key: string, member: RedisValue): Promise<Integer | BulkNil>;
  zscan(
    key: string,
    cursor: number,
    opts?: ZScanOpts,
  ): Promise<[BulkString, BulkString[]]>;
  zscore(key: string, member: RedisValue): Promise<Bulk>;
  zunionstore(
    destination: string,
    keys: string[],
    opts?: ZUnionstoreOpts,
  ): Promise<Integer>;
  zunionstore(
    destination: string,
    key_weights: [string, number][],
    opts?: ZUnionstoreOpts,
  ): Promise<Integer>;
  zunionstore(
    destination: string,
    key_weights: Record<string, number>,
    opts?: ZUnionstoreOpts,
  ): Promise<Integer>;

  // Client
  /**
   * This command controls the tracking of the keys in the next command executed by the connection.
   * @see https://redis.io/commands/client-caching
   */
  clientCaching(mode: ClientCachingMode): Promise<SimpleString>;

  /**
   * Returns the name of the current connection which can be set by `clientSetName`.
   * @see https://redis.io/commands/client-getname
   */
  clientGetName(): Promise<Bulk>;

  /**
   * Returns the client ID we are redirecting our tracking notifications to.
   * @see https://redis.io/commands/client-getredir
   */
  clientGetRedir(): Promise<Integer>;

  /**
   * Returns the id of the current redis connection.
   */
  clientID(): Promise<Integer>;

  /**
   * Returns information and statistics about the current client connection in a mostly human readable format.
   * @see https://redis.io/commands/client-info
   */
  clientInfo(): Promise<Bulk>;

  /**
   * Closes a given client connection.
   * @see https://redis.io/commands/client-kill
   */
  clientKill(opts?: ClientKillOpts): Promise<Integer>;

  /**
   * Returns information and statistics about the client connections server in a mostly human readable format.
   * @see https://redis.io/commands/client-list
   */
  clientList(opts?: ClientListOpts): Promise<Bulk>;

  /**
   * Suspend all the Redis clients for the specified amount of time (in milliseconds).
   * @see https://redis.io/commands/client-pause
   */
  clientPause(timeout: number, mode?: ClientPauseMode): Promise<SimpleString>;

  /**
   * Sets a `connectionName` to the current connection.
   * You can get the name of the current connection using `clientGetName()`.
   * @see https://redis.io/commands/client-setname
   */
  clientSetName(connectionName: string): Promise<SimpleString>;

  /**
   * Enables the tracking feature for the Redis server that is used for server assisted client side caching.
   * @see https://redis.io/commands/client-tracking
   */
  clientTracking(opts: ClientTrackingOpts): Promise<SimpleString>;

  /**
   * Returns information about the current client connection's use of the server assisted client side caching feature.
   * @see https://redis.io/commands/client-trackinginfo
   */
  clientTrackingInfo(): Promise<ConditionalArray>;

  /**
   * This command can unblock, from a different connection, a client blocked in a blocking operation.
   * @see https://redis.io/commands/client-unblock
   */
  clientUnblock(
    id: number,
    behaviour?: ClientUnblockingBehaviour,
  ): Promise<Integer>;

  /**
   * Used to resume command processing for all clients that were paused by `clientPause`.
   * @see https://redis.io/commands/client-unpause
   */
  clientUnpause(): Promise<SimpleString>;

  // Cluster
  /**
   * @see https://redis.io/topics/cluster-spec
   */
  asking(): Promise<SimpleString>;
  clusterAddSlots(...slots: number[]): Promise<SimpleString>;
  clusterCountFailureReports(node_id: string): Promise<Integer>;
  clusterCountKeysInSlot(slot: number): Promise<Integer>;
  clusterDelSlots(...slots: number[]): Promise<SimpleString>;
  clusterFailover(mode?: ClusterFailoverMode): Promise<SimpleString>;
  clusterFlushSlots(): Promise<SimpleString>;
  clusterForget(node_id: string): Promise<SimpleString>;
  clusterGetKeysInSlot(slot: number, count: number): Promise<BulkString[]>;
  clusterInfo(): Promise<BulkString>;
  clusterKeySlot(key: string): Promise<Integer>;
  clusterMeet(ip: string, port: number): Promise<SimpleString>;
  clusterMyID(): Promise<BulkString>;
  clusterNodes(): Promise<BulkString>;
  clusterReplicas(node_id: string): Promise<BulkString[]>;
  clusterReplicate(node_id: string): Promise<SimpleString>;
  clusterReset(mode?: ClusterResetMode): Promise<SimpleString>;
  clusterSaveConfig(): Promise<SimpleString>;
  clusterSetSlot(
    slot: number,
    subcommand: ClusterSetSlotSubcommand,
    node_id?: string,
  ): Promise<SimpleString>;
  clusterSlaves(node_id: string): Promise<BulkString[]>;
  clusterSlots(): Promise<ConditionalArray>;
  readonly(): Promise<SimpleString>;
  readwrite(): Promise<SimpleString>;

  // Server
  aclCat(categoryname?: string): Promise<BulkString[]>;
  aclDelUser(...usernames: string[]): Promise<Integer>;
  aclGenPass(bits?: number): Promise<BulkString>;
  aclGetUser(username: string): Promise<(BulkString | BulkString[])[]>;
  aclHelp(): Promise<BulkString[]>;
  aclList(): Promise<BulkString[]>;
  aclLoad(): Promise<SimpleString>;
  aclLog(count: number): Promise<BulkString[]>;
  aclLog(mode: ACLLogMode): Promise<SimpleString>;
  aclSave(): Promise<SimpleString>;
  aclSetUser(username: string, ...rules: string[]): Promise<SimpleString>;
  aclUsers(): Promise<BulkString[]>;
  aclWhoami(): Promise<BulkString>;
  bgrewriteaof(): Promise<SimpleString>;
  bgsave(): Promise<SimpleString>;
  command(): Promise<
    [BulkString, Integer, BulkString[], Integer, Integer, Integer][]
  >;
  commandCount(): Promise<Integer>;
  commandGetKeys(): Promise<BulkString[]>;
  commandInfo(
    ...command_names: string[]
  ): Promise<
    ([BulkString, Integer, BulkString[], Integer, Integer, Integer] | BulkNil)[]
  >;
  configGet(parameter: string): Promise<BulkString[]>;
  configResetStat(): Promise<SimpleString>;
  configRewrite(): Promise<SimpleString>;
  configSet(parameter: string, value: string): Promise<SimpleString>;
  dbsize(): Promise<Integer>;
  debugObject(key: string): Promise<SimpleString>;
  debugSegfault(): Promise<SimpleString>;
  flushall(async?: boolean): Promise<SimpleString>;
  flushdb(async?: boolean): Promise<SimpleString>;
  info(section?: string): Promise<BulkString>;
  lastsave(): Promise<Integer>;
  memoryDoctor(): Promise<BulkString>;
  memoryHelp(): Promise<BulkString[]>;
  memoryMallocStats(): Promise<BulkString>;
  memoryPurge(): Promise<SimpleString>;
  memoryStats(): Promise<ConditionalArray>;
  memoryUsage(key: string, opts?: MemoryUsageOpts): Promise<Integer>;
  moduleList(): Promise<BulkString[]>;
  moduleLoad(path: string, ...args: string[]): Promise<SimpleString>;
  moduleUnload(name: string): Promise<SimpleString>;
  monitor(): void;
  replicaof(host: string, port: number): Promise<SimpleString>;
  replicaofNoOne(): Promise<SimpleString>;
  role(): Promise<RoleReply>;
  save(): Promise<SimpleString>;
  shutdown(mode?: ShutdownMode): Promise<SimpleString>;
  slaveof(host: string, port: number): Promise<SimpleString>;
  slaveofNoOne(): Promise<SimpleString>;
  slowlog(subcommand: string, ...args: string[]): Promise<ConditionalArray>;
  swapdb(index1: number, index2: number): Promise<SimpleString>;
  sync(): void;
  time(): Promise<[BulkString, BulkString]>;

  // Scripting
  eval(script: string, keys: string[], args: RedisValue[]): Promise<Raw>;
  evalsha(sha1: string, keys: string[], args: RedisValue[]): Promise<Raw>;
  scriptDebug(mode: ScriptDebugMode): Promise<SimpleString>;
  scriptExists(...sha1s: string[]): Promise<Integer[]>;
  scriptFlush(): Promise<SimpleString>;
  scriptKill(): Promise<SimpleString>;
  scriptLoad(script: string): Promise<SimpleString>;

  // Transactions
  discard(): Promise<SimpleString>;
  exec(): Promise<ConditionalArray>;
  multi(): Promise<SimpleString>;
  unwatch(): Promise<SimpleString>;
  watch(...keys: string[]): Promise<SimpleString>;

  // Pipeline
  tx(): RedisPipeline;
  pipeline(): RedisPipeline;
}
