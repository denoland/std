import React from 'react'
import ThreeBox from './ThreeBox'
import PropTypes from 'prop-types'
import play from './play'
import Debug from 'debug'
const debug = Debug('App')


export default {
  title: 'AI',
  component: ThreeBox,
}

const Template = (args) => {
  Debug.enable('iplog')
  return (
    <Engine dev={{ '/crm': apps.crm.covenant }} {...args}>
      <Syncer path="/.HAL">
        <ThreeBox />
      </Syncer>
    </Engine>
  )
}

export const AddCustomer = Template.bind({})
AddCustomer.play = play(makeInit())
