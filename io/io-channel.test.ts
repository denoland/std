/**
 * Designed to exercise the pending operations.
 */

import { IoStruct, partialFromRepo } from '@/constants.ts'
import IOChannel from '@io/io-channel.ts'
import { Proctype } from '@/api/types.ts'
import { expect } from '@utils'

const partial = partialFromRepo('system/system')
const pid = { ...partial, repoId: 'rep_R64KH614QH4TDW2V' }
Deno.test('io-channel', () => {
  const json = serialAccumulation()
  const io = IOChannel.readObject(json, pid)
  expect(io.isExecutionAvailable()).toBeTruthy()
  const { request, sequence } = io.setExecution()
  const executing = io.getRunnableExecution()
  const outbound = json.requests[1]
  expect(executing).toEqual(outbound)
  expect(sequence).toBe(1)
  expect(request).toEqual(outbound)
})
Deno.test('remote requests', () => {
  const json = serialAccumulation()
  json.requests[1].target.branches = ['main', 'other']
  const io = IOChannel.readObject(json, pid)
  expect(io.isExecutionAvailable()).toBeFalsy()
})

// refuse to run unless all of a pending layer is solved

// test writing files then doing some accumulation requests, and ensuring that
// those files are present accurately

// if multiple requests are eligible, its always the lowest sequence number

const serialAccumulation: () => IoStruct = () => ({
  executed: { 0: true },
  sequence: 2,
  requests: {
    0: {
      target: {
        repoId: 'rep_R64KH614QH4TDW2V',
        account: 'system',
        repository: 'system',
        branches: ['main'],
      },
      ulid: '01HV3NRRWC4NQVZ5PEKD8XWBMY',
      isolate: 'backchat',
      functionName: 'pierce',
      params: {
        request: {
          target: {
            repoId: 'rep_R64KH614QH4TDW2V',
            account: 'system',
            repository: 'system',
            branches: ['main'],
          },
          isolate: 'repo',
          functionName: 'rm',
          params: { repo: 'test/test' },
          proctype: Proctype.enum.SERIAL,
        },
      },
      proctype: Proctype.enum.SERIAL,
    },
    1: {
      target: {
        repoId: 'rep_R64KH614QH4TDW2V',
        account: 'system',
        repository: 'system',
        branches: ['main'],
      },
      isolate: 'repo',
      functionName: 'rm',
      params: { repo: 'test/test' },
      proctype: Proctype.enum.SERIAL,
      sequence: 1,
      source: {
        repoId: 'rep_R64KH614QH4TDW2V',
        account: 'system',
        repository: 'system',
        branches: ['main'],
      },
    },
  },
  replies: {},
  parents: {},
  pendings: {
    0: [{ commit: '1222aa01861192073e2a02c803767f75574ff5be', sequences: [1] }],
  },
  branches: {},
  state: {},
})
