/**
 * Designed to exercise the pending operations.
 */

import { IoStruct } from '@/constants.ts'
import IOChannel from '@io/io-channel.ts'
import { pidFromRepo } from '@/keys.ts'
import { PROCTYPE } from '@/api/web-client.types.ts'
import { expect } from '@utils'

Deno.test('io-channel', () => {
  // check how the executing request is handled
  // be able to settle pending requests out of order
  // refuse to run unless all of a pending layer is solved
  const pid = pidFromRepo('io', 'test/test')
  const io = IOChannel.readObject(serialAccumulation, pid)
  const executing = io.getNextSerialRequest()
  const outbound = serialAccumulation.requests[1]
  expect(executing).toEqual(outbound)
})

// test writing files then doing some accumulation requests, and ensuring that
// those files are present accurately

// if multiple requests are eligible, its always the lowest sequence number

// need to remove the runnablerequest function and just run actions raw somehow
// ?  The transform is bad

// can an unsequenced thing be added without being put into pending ?

const serialAccumulation: IoStruct = {
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
}
