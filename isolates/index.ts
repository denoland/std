import * as engageHelp from './engage-help.ts'
import * as fetch from './fetch.ts'
import * as files from './files.ts'
import * as git from './git.ts'
import * as ioFixture from './io-fixture.ts'
import * as loadHelp from './load-help.ts'
import * as utils from './utils.ts'
import * as artifact from './artifact.ts'
import * as session from './session.ts'
import * as repo from './repo.ts'
import * as shell from './shell.ts'

import * as completions from './ai-completions.ts'
import * as executeTools from './ai-execute-tools.ts'
import * as loadTools from './ai-load-tools.ts'
import * as promptInjector from './ai-prompt-injector.ts'
import * as prompt from './ai-prompt.ts'

import * as hal from './hal.ts'

export default {
  'engage-help': engageHelp,
  fetch,
  files,
  git,
  'io-fixture': ioFixture,
  'load-help': loadHelp,
  utils,
  artifact,
  session,
  repo,
  shell,
  'ai-completions': completions,
  'ai-execute-tools': executeTools,
  'ai-load-tools': loadTools,
  'ai-prompt-injector': promptInjector,
  'ai-prompt': prompt,
  hal,
}
