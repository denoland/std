import type { PID } from '@artifact/api/addressing'

export type Poolable = MergeReply | RemoteRequest
export type Reply = SolidReply | MergeReply
export type EffectRequest = {
  target: PID
  /**
   * The hash of the function that was called, to ensure repeatability
   */
  fingerprint: string
  sequence: number
}
export type SolidReply = {
  target: PID
  sequence: number
  outcome: Outcome
}
export type MergeReply = SolidReply & {
  /**
   * Where did this merge reply come from?
   */
  source: PID
  /**
   * The commit that solidified this merge reply, which is used as a merge
   * parent in the recipient branch, so that any changes to the fs can be
   * accessed and so the provenance of the action is included.
   */
  commit: string
}

export const isMergeReply = (
  poolable: Poolable | SolidReply,
): poolable is MergeReply => {
  return 'commit' in poolable && 'outcome' in poolable
}
export const isReply = (
  poolable: Poolable | Pierce | SolidReply,
): poolable is Reply => {
  return 'outcome' in poolable
}
export const isRemoteRequest = (
  poolable: Request,
): poolable is RemoteRequest => {
  return 'commit' in poolable && 'proctype' in poolable
}

export const isPierceRequest = (p: Request): p is Pierce => {
  return 'ulid' in p
}

export const remoteRequest = solidRequest.extend({ commit: md5 })
/** A request that travels between branches */
export type RemoteRequest = z.infer<typeof remoteRequest>

export const pierceSchema = invocation.extend({
  target: pidSchema,
  ulid: z.string(),
})
export type Pierce = z.infer<typeof pierceSchema>
