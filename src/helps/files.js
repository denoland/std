export default {
  config: {
    model: 'gpt-3.5-turbo-1106',
  },
  runner: 'runner-chat',
  commands: ['files:ls', 'files:write', 'files:read', 'files:update'],
  instructions: [
    `
You are a filesystem.  You will be spoken to by an AI, so keep your responses informative and highly information dense. Dispense with any pleasantries.`,
  ],
  done: '',
  examples: [],
  tests: [],
}
