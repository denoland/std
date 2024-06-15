import * as system from './system.ts'

import * as engageHelp from './engage-help.ts'
import * as fetch from './fetch.ts'
import * as files from './files.ts'
import * as ioFixture from './io-fixture.ts'
import * as loadHelp from './load-help.ts'
import * as utils from './utils.ts'
import * as artifact from './artifact.ts'
import * as session from './session.ts'
import * as shell from './shell.ts'

import * as completions from './ai-completions.ts'
import * as loadTools from './ai-load-tools.ts'
import * as promptInjector from './ai-prompt-injector.ts'
import * as prompt from './ai-prompt.ts'

import * as hal from './hal.ts'
import * as github from './github.ts'
import * as actors from './actors.ts'

export default {
  system,
  'engage-help': engageHelp,
  fetch,
  files,
  'io-fixture': ioFixture,
  'load-help': loadHelp,
  utils,
  artifact,
  session,
  shell,
  'ai-completions': completions,
  'ai-load-tools': loadTools,
  'ai-prompt-injector': promptInjector,
  'ai-prompt': prompt,
  hal,
  github,
  actors,
}
