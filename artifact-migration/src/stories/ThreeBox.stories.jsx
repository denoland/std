import ThreeBox from './ThreeBox'
import { Provider } from './Provider'
import Debug from 'debug'

export default {
  title: 'ThreeBox',
  component: ThreeBox,
}

const Template = (args) => {
  Debug.enable('AI:hooks AI:trigger-fs AI:Provider AI:ThreeBox AI:artifact')
  return (
    <Provider>
      <ThreeBox {...args} />
    </Provider>
  )
}

export const Blank = Template.bind({})
export const Preload = Template.bind({})
Preload.args = { preload: 'Hello' }
export const MultiLine = Template.bind({})
MultiLine.args = {
  preload:
    `Moreover, the Internet has given rise to new forms of social interaction that can have both positive and negative consequences. While it can foster community and support networks, it can also enable cyberbullying, misinformation, and other harmful behaviors. Navigating the ethical and social implications of the Internet is an ongoing process that requires careful consideration and active engagement from all stakeholders.

In conclusion, the Internet has had a profound impact on modern society, touching every aspect of our lives. Its ability to connect people, provide access to information, and offer new opportunities for commerce and entertainment has been transformative. As we continue to integrate the Internet into our daily routines, it is essential to address the challenges it presents to ensure that it remains a positive force for change and innovation.`,
}
export const Presubmit = Template.bind({})
Presubmit.args = { preload: 'Say a single word', presubmit: true }
