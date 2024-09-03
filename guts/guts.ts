// the Grand Unified Test Suite™

import branching from './guts-branching.ts'
import longthread from './guts-longthread.ts'
import splices from './guts-splices.ts'
import backchats from './guts-backchats.ts'
import focus from './guts-focus.ts'
import git from './guts-git.ts'
import tpsReports from './guts-tps-reports.ts'
// import benchmarks from './benchmarks.ts'
// import isolates from './guts-ai-isolates.ts'
import { CradleMaker } from '@/constants.ts'

export default (name: string, cradleMaker: CradleMaker) => {
  branching(name, cradleMaker)
  backchats(name, cradleMaker)
  longthread(name, cradleMaker)
  splices(name, cradleMaker)
  focus(name, cradleMaker)
  git(name, cradleMaker)
  tpsReports(name, cradleMaker)
  // isolates(name, cradleMaker)
  // benchmarks(name, cradleMaker)
}
