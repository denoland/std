// the Grand Unified Test Suite™

import branching from './guts-branching.ts'
import longthread from './guts-longthread.ts'
import splices from './guts-splices.ts'
import backchats from './guts-backchats.ts'
import focus from './guts-focus.ts'
import git from './guts-git.ts'
import tpsReports from './guts-tps-reports.ts'
import benchmarks from './guts-benchmarks.ts'
import isolates from './guts-ai-isolates.ts'
import { CradleMaker } from '@/constants.ts'

export default (cradleMaker: CradleMaker) => {
  branching(cradleMaker)
  backchats(cradleMaker)
  longthread(cradleMaker)
  splices(cradleMaker)
  focus(cradleMaker)
  git(cradleMaker)
  tpsReports(cradleMaker)
  isolates(cradleMaker)
  benchmarks(cradleMaker)
}
