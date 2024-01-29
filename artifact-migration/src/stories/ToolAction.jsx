import remarkGfm from 'remark-gfm'
import Markdown from 'react-markdown'
import { ObjectInspector } from 'react-inspector'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Terminal from '@mui/icons-material/Terminal'
import Debug from 'debug'
import PropTypes from 'prop-types'
// import { createTheme, ThemeProvider } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'

const debug = Debug('AI:ToolAction')

export const ToolAction = ({ tool_calls, messages }) => {
  // const noDisabled = createTheme({ palette: { text: { disabled: '0 0 0' } }
  // })

  // need to get the isolate from the caller
  // then get the schema from the api
  // THEN somehow format the output or have a schema for it ?
  return tool_calls.map((tool_call, key) => {
    debug('tool_call', tool_call)
    const { id, function: func } = tool_call
    const { name, arguments: args } = func
    const data = tryParse(args)
    const output = findOutput(messages, id)
    return (
      <Card key={key}>
        <CardHeader
          title={name}
          titleTypographyProps={{ variant: 'h6' }}
          avatar={<Terminal />}
        />
        <CardContent sx={{ pt: 0, pb: 0 }}>
          <ObjectInspector data={data} expandLevel={999} />
        </CardContent>
        <CardHeader
          title='Output:'
          titleTypographyProps={{ variant: 'h6' }}
          avatar={<Terminal />}
        />
        <CardContent sx={{ pt: 0, pb: 0, fontFamily: 'sans-serif' }}>
          {typeof output === 'string'
            ? <Markdown remarkPlugins={[remarkGfm]}>{output}</Markdown>
            : <ObjectInspector data={output} expandLevel={999} />}
        </CardContent>
      </Card>
    )
  })
}
ToolAction.propTypes = {
  tool_calls: PropTypes.arrayOf(PropTypes.object),
  messages: PropTypes.arrayOf(PropTypes.object),
}
const findOutput = (messages, id) => {
  const message = messages.find((message) => message.tool_call_id === id)
  if (message) {
    return tryParse(message.content)
  }
}
const tryParse = (value) => {
  try {
    return JSON.parse(value)
  } catch (e) {
    return value
  }
}
