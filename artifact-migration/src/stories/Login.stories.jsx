import ThreeBox from './ThreeBox'
import { Provider } from './Provider'
import Debug from 'debug'

export default {
  title: 'Login',
  component: ThreeBox,
}

const Template = (args) => {
  Debug.enable('AI:hooks AI:trigger-fs AI:Provider AI:ThreeBox')
  return (
    <Provider>
      <ThreeBox {...args} />
    </Provider>
  )
}

export const Device = Template.bind({})
Presubmit.args = { preload: 'Log in with github', presubmit: true }
