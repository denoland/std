import ThreeBox from './ThreeBox'
import { Provider } from './Provider'
import Debug from 'debug'

export default {
  title: 'ThreeBox',
  component: ThreeBox,
}

const Template = (args) => {
  Debug.enable('AI:*')
  return (
    <Provider wipe>
      <ThreeBox {...args} />
    </Provider>
  )
}

export const Blank = Template.bind({})
export const Preload = Template.bind({})
Preload.args = { preload: 'Hello' }
export const Presubmit = Template.bind({})
Presubmit.args = { preload: 'Say a single word', presubmit: true }
