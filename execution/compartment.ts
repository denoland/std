import Debug from 'debug'
const log = Debug('AI:compartment')
import napps from './napps-import.ts'

export default class Compartment {
  static async load(napp: keyof typeof napps) {
    await Promise.resolve() // simulates loading from the network
    const compartment = new Compartment(napp)
    return compartment
  }
  #napp: typeof napps[keyof typeof napps]
  private constructor(napp: keyof typeof napps) {
    log('load napp:', napp)
    this.#napp = napps[napp]
  }
  execute() {
  }
  step(accumulator) {
  }
  tearDown() {
  }
}
