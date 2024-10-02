import { cradleMaker } from '@/cradle-maker.ts'

export const actorId = 'testerActorId'

export const infoPath = 'info/test-format.md'
export const requesterPath = 'agents/test-requester.md'
export const assessorPath = 'agents/test-assessor.md'
export const fileRunnerPath = 'agents/test-file-runner.md'
export const meetingsPath = 'agents/meetings.md'
export const routerPath = 'agents/router.md'

export const firstTestPath = 'tests/fixtures/test-file-runner.test.md'
export const secondTestPath = 'tests/fixtures/second.test.md'
export const meetingTestPath = 'tests/meetings.test.md'
export const routerTestPath = 'tests/router.test.md'
export const testFixturePath = 'tests/test-fixture.test.md'
export const testRunnterTestPath = 'tests/test-file-runner.test.md'

export const info = await Deno.readTextFile('./HAL/' + infoPath)
export const requester = await Deno.readTextFile('./HAL/' + requesterPath)
export const assessor = await Deno.readTextFile('./HAL/' + assessorPath)
export const fileRunner = await Deno.readTextFile('./HAL/' + fileRunnerPath)
export const meetings = await Deno.readTextFile('./HAL/' + meetingsPath)
export const router = await Deno.readTextFile('./HAL/' + routerPath)
export const testFixture = await Deno.readTextFile('./HAL/' + testFixturePath)

export const firstTest = await Deno.readTextFile(firstTestPath)
export const secondTest = await Deno.readTextFile(secondTestPath)
export const meetingTest = await Deno.readTextFile('./HAL/' + meetingTestPath)
export const routerTest = await Deno.readTextFile('./HAL/' + routerTestPath)
export const testRunnerTest = await Deno.readTextFile(
  './HAL/' + testRunnterTestPath,
)

export const fixture = async () => {
  const { backchat, engine } = await cradleMaker()

  await backchat.write(infoPath, info)
  await backchat.write(requesterPath, requester)
  await backchat.write(assessorPath, assessor)
  await backchat.write(fileRunnerPath, fileRunner)
  await backchat.write(meetingsPath, meetings)
  await backchat.write(routerPath, router)

  await backchat.write(firstTestPath, firstTest)
  await backchat.write(secondTestPath, secondTest)
  await backchat.write(meetingTestPath, meetingTest)
  await backchat.write(routerTestPath, routerTest)
  await backchat.write(testFixturePath, testFixture)
  await backchat.write(testRunnterTestPath, testRunnerTest)

  return { backchat, engine }
}
