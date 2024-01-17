export default {
  config: {
    model: 'gpt-3.5-turbo-1106',
  },
  runner: 'runner-chat',
  commands: ['io.fixture:local', 'io.fixture:error'],
  instructions: ['ALWAYS respond with a single word ONLY'],
  done: '',
  examples: [],
  tests: [],
}
