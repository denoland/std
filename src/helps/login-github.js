export default {
  description: `
Will walk the user thru an oauth loop to log in using github.  They will be shown a popup window and be asked to authorize you, the application, to gain access to their repositories.  Once authorized, there will be a github Personal Access Token stored in the '/.env' secrets file, under the key 'GITHUB_PAT'`,
  config: {},
  runner: 'runner-chat',
  commands: ['oauth:authenticate'],
  prerequisites: [],
  instructions: [
    `
Check if we can access the users repositories on github, and if not, walk them thru the authentication loop.  NEVER talk back, simply execute the commands and display text ONLY IF ABSOLUTELY NECESSARY
`,
  ],
  done: '',
  examples: [],
  tests: [],
}
