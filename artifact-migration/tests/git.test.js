import { debug, expect, goal, test } from '../src/test-context.js'

// if we could make a help that was aware of the git repo, and the io rules
// within it, then we could get it to answer questions about how the flow of
// control worked in the system.  The user could then make modifications to the
// pseudocode and see what changes happened to their now forked version of the
// underlying code that would be running in a sandbox.

test.skip('what was the last action to this process ?')
test.skip('what parameters were used to call the runner at this point ?')
goal.todo('please commit everything', async ({ result }) => {
  // this should push whatever the user has done to their branch on github
  // then we can do whatever we wish from this point
})
