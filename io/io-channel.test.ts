/**
 * Designed to exercise the pending operations.
 */

import { IoStruct, pidFromRepo } from '@/constants.ts'
import IOChannel from '@io/io-channel.ts'
import { PROCTYPE } from '@/api/web-client.types.ts'
import { expect } from '@utils'

const pid = pidFromRepo('__system', 'system/system')
Deno.test('io-channel', () => {
  const json = serialAccumulation()
  const io = IOChannel.readObject(json, pid)
  const executing = io.getNextSerialRequest()
  const outbound = json.requests[1]
  expect(executing).toEqual(outbound)
})
Deno.test('remote requests', () => {
  const json = serialAccumulation()
  json.requests[1].target.branches = ['main', 'other']
  const io = IOChannel.readObject(json, pid)
  const executing = io.getNextSerialRequest()
  expect(executing).toBeUndefined()
})
// refuse to run unless all of a pending layer is solved

// test writing files then doing some accumulation requests, and ensuring that
// those files are present accurately

// if multiple requests are eligible, its always the lowest sequence number

const serialAccumulation: () => IoStruct = () => ({
  sequence: 2,
  requests: {
    0: {
      target: {
        id: '__system',
        account: 'system',
        repository: 'system',
        branches: ['main'],
      },
      ulid: '01HV3NRRWC4NQVZ5PEKD8XWBMY',
      isolate: 'shell',
      functionName: 'pierce',
      params: {
        request: {
          target: {
            id: '__system',
            account: 'system',
            repository: 'system',
            branches: ['main'],
          },
          isolate: 'repo',
          functionName: 'rm',
          params: { repo: 'test/test' },
          proctype: 'SERIAL',
        },
      },
      proctype: PROCTYPE.SERIAL,
    },
    1: {
      target: {
        id: '__system',
        account: 'system',
        repository: 'system',
        branches: ['main'],
      },
      isolate: 'repo',
      functionName: 'rm',
      params: { repo: 'test/test' },
      proctype: PROCTYPE.SERIAL,
      sequence: 1,
      source: {
        id: '__system',
        account: 'system',
        repository: 'system',
        branches: ['main'],
      },
    },
  },
  replies: {},
  pendings: {
    0: [{ commit: '1222aa01861192073e2a02c803767f75574ff5be', sequences: [1] }],
  },
})
