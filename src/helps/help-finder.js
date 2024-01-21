export default {
  description: `Finds the most appropriate help file that can be used to achieve the user's goal.`,
  config: {},
  runner: 'runner-injector',
  commands: [],
  instructions: [
    `You are an expert in finding the right help file to use.  Below you will be given a list of json objects where the 'name' key represents the name of the help file, and the 'help' key represents the help file at that path.  You will carefully consider which is the best of all these options and you will respond with the name of the help file that you think is the best.  If there is no best option, the best option is the 'stuckloop' help file.

    ONLY REPLY WITH THE NAME OF THE HELP FILE, NOTHING ELSE
    `,
  ],

  done: '',
  examples: [],
  tests: [],
}
