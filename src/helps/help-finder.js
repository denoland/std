export default {
  description: `Finds the most appropriate help file that can be used to achieve the user's goal.`,
  config: {},
  runner: 'runner-injector',
  commands: [],
  instructions: [
    `You are an expert in finding the right help file to use.  Below you will be given a list of json objects where the 'name' key represents the name of the help file, and the 'help' key represents the help file at that path.  You will carefully consider which is the best of all these options and you will respond with the name of the help file that you think is the best.  If there is no clear best option, you will respond with 'stuckloop', which is the name of a special help that is used to create new helps that will expand your capabilities in future calls`,
  ],

  // THE STUCK LOOP IS THE DEFAULT CHOICE !#%
  done: '',
  examples: [],
  tests: [],
}
