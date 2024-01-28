import ThreeBox from './ThreeBox'
import { Provider } from './Provider'
import Debug from 'debug'

export default {
  title: 'Import',
  component: ThreeBox,
}

const Template = (args) => {
  Debug.enable('AI:*')
  return (
    <Provider>
      <ThreeBox {...args} />
    </Provider>
  )
}
// supposed to test importing the moneyworks database
// add some fake data first, and then start displaying it

export const Blank = Template.bind({})
export const Fake = Template.bind({})
Fake.args = { preload: 'generate ten fake customers', presubmit: true }
export const Presubmit = Template.bind({})
Presubmit.args = { preload: 'import customers', presubmit: true }
