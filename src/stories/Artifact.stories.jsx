// import ThreeBox from './ThreeBox'
// import Artifact from './Artifact'
import Debug from 'debug'

export default {
  title: 'Artifact',
  // component: Artifact,
}

const Template = () => {
  Debug.enable('*StateBoard')
  return <Artifact></Artifact>
}

export const Boot = Template.bind({})
