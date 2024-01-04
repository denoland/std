import { ObjectInspector } from 'react-inspector'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Cancel from '@mui/icons-material/Cancel'
import Terminal from '@mui/icons-material/Terminal'
import Debug from 'debug'
import PropTypes from 'prop-types'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'

const debug = Debug('AI:ToolAction')

export const ToolAction = ({ name, schema, args = {}, output }) => {
  const noDisabled = createTheme({ palette: { text: { disabled: '0 0 0' } } })
  const { title, ...noTitleSchema } = schema

  return (
    <Card>
      <ThemeProvider theme={noDisabled}>
        <CardHeader
          title={name}
          titleTypographyProps={{ variant: 'h6' }}
          avatar={<Terminal />}
        />
        <CardContent sx={{ pt: 0, pb: 0 }}>
          <Form
            validator={validator}
            disabled={true}
            schema={noTitleSchema}
            formData={args}
          >
            <div id="hides the submit button"></div>
          </Form>
        </CardContent>
        <CardHeader
          title="Output:"
          titleTypographyProps={{ variant: 'h6' }}
          avatar={<Terminal />}
        />
        <CardContent sx={{ pt: 0, pb: 0 }}>
          <ObjectInspector data={output} />
        </CardContent>
      </ThemeProvider>
    </Card>
  )
}
ToolAction.propTypes = {
  name: PropTypes.string,
  schema: PropTypes.object,
  args: PropTypes.object,
  output: PropTypes.object,
}
