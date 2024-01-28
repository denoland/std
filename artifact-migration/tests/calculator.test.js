import { goal, debug } from '../src/test-context.js'

// should be able to do some math and get the answer right each time by using an
// AI that is tuned to do calculations effectively.  More complex requests
// should trigger the stuckloop
goal.todo('whats 100 / 3 ?')
