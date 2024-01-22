import Messages from './Messages'
import play from './play'
import Debug from 'debug'
import Box from '@mui/material/Box'
const debug = Debug('Messages')
const STATUS = { RUNNING: 'RUNNING', DONE: 'DONE', ERROR: 'ERROR' }

export default {
  title: 'Messages',
  // component: Messages,
}

const messages = [
  {
    role: 'system',
    content:
      "You are an expert at goal detection.  Be as brief as possible.\n\nBreak apart the users request into discrete goals, with any dependent goals coming after the goal they depend on.\n\nWork thru these goals one at a time with the user.  Clarify the goal if you are unsure, then call the 'help-finder' function.  This function will return the name of a help file to use to meet that goal.\n\nIf the help reply was 'stuckloop' then apologize for an unimplented feature then exit immediately by way of hari kari.\n\nOnce the name of the help file is returned from the 'help-finder' function, call the 'load' function with the name of the help to get the contents of the help file, that you may examine the help further.  Consider then if this will solve your users current goal and consider the requirements this help needs as context.  If not, converse with the user more until you can make a different call to the 'help-finder'.  Do not apologize and do not mention help files.  Help files are your inner workings and are not to be exposed to the user.  Offer suggestions of what the user might mean, and ask the user to clarify their goal.\n\nIf you think the help file will solve the users problem, then call the 'engage' function with the path to the help file and the text that you want to pass to the help file.  The text is natural language as the help file is being executed by an AI like yourself.  The 'engage' function will execute the help file in a separate branch and then return the result to you.  Be sure to gather as much information from the user that the help file will need before you execute the help file.",
  },
  {
    role: 'user',
    content: 'create a new md file',
  },
  {
    role: 'assistant',
    tool_calls: [
      {
        id: 'call_i8C8lqCmSfYzOqYa9YCxDkON',
        type: 'function',
        function: {
          name: 'help-finder',
          arguments: '{"text":"create a new md file"}',
        },
      },
    ],
  },
  {
    role: 'tool',
    tool_call_id: 'call_i8C8lqCmSfYzOqYa9YCxDkON',
    content: 'create-help',
  },
  {
    role: 'assistant',
    tool_calls: [
      {
        id: 'call_kShQuzYlpAQenLDbZIcwCgF2',
        type: 'function',
        function: {
          name: 'load',
          arguments: '{"help":"create-help"}',
        },
      },
    ],
  },
  {
    role: 'tool',
    tool_call_id: 'call_kShQuzYlpAQenLDbZIcwCgF2',
    content:
      '{\n  "config": {},\n  "runner": "runner-chat",\n  "commands": [],\n  "prerequisites": [],\n  "instructions": [\n    "\\nGive it the format of a blank file.\\nTeach it how to write these files out.\\nOnce written, it is automatically picked up by the help-finder.\\nWe should guide the user thru how to run some tests, and show the default tests that are automatically running on it, with the examples being used to test its outputs and expectations.\\n"\n  ],\n  "done": "",\n  "examples": [],\n  "tests": []\n}',
  },
  {
    role: 'assistant',
    content:
      'To create a new markdown (md) file, could you please clarify if you need guidance on the markdown syntax for creating specific content or if you are looking to generate a blank md file?',
  },
  {
    role: 'user',
    content: 'just a blank on thanks',
  },
  {
    role: 'assistant',
    tool_calls: [
      {
        id: 'call_tmkLJN3yDs63QXkH3imrZlRe',
        type: 'function',
        function: {
          name: 'engage',
          arguments:
            '{"help":"create-help","text":"I need to create a blank markdown file."}',
        },
      },
    ],
  },
  {
    role: 'tool',
    tool_call_id: 'call_tmkLJN3yDs63QXkH3imrZlRe',
    content:
      'Creating a blank Markdown file is a simple process that can be done with any text editor. Here\'s a step-by-step guide on how to create a blank Markdown file:\n\n1. **Open a Text Editor:**\n   Choose a text editor that you are comfortable with. This could be Notepad on Windows, TextEdit on macOS (in plain text mode), or any code editor like Visual Studio Code, Atom, Sublime Text, etc.\n\n2. **Create a New File:**\n   In your text editor, create a new file by going to the File menu and selecting "New" or by using the shortcut (usually `Ctrl + N` on Windows or `Cmd + N` on macOS).\n\n3. **Save the File with a `.md` Extension:**\n   Save the new file with a `.md` extension, which denotes a Markdown file. Go to the File menu and select "Save As." In the dialog box, enter a filename followed by `.md` (for example, `README.md`) and choose the location where you want to save the file. Then click "Save."\n\n4. **Write Markdown Content (Optional):**\n   If you want to add content to your Markdown file, you can start typing using Markdown syntax. Since you want a blank file, you can skip this step.\n\n5. **Close the Text Editor:**\n   If you\'re done with your file, you can close the text editor.\n\nNow you have a blank Markdown file that you can fill with content as needed.\n\nTo test if your Markdown file is working as expected, you can use a Markdown previewer or convert the Markdown to HTML. Many code editors have built-in Markdown previewers. For example, if you\'re using Visual Studio Code, you can open the Command Palette (`Ctrl + Shift + P` or `Cmd + Shift + P`) and type "Markdown preview" to find the option to preview your file.\n\nDefault tests for Markdown files usually involve checking the syntax and rendering of the Markdown content. For example, you might want to ensure that headers, lists, links, images, and code blocks are displaying correctly. You can create a few sample Markdown elements to test this:\n\n```markdown\n# Header 1\n## Header 2\n### Header 3\n\n- List item 1\n- List item 2\n- List item 3\n\n[Link to Google](https://www.google.com)\n\n![Alt text for an image](https://via.placeholder.com/150)\n\n`Inline code` with backticks\n\n```python\n# Code block with syntax highlighting\ndef hello_world():\n    print("Hello, world!")\n```\n```\n\nPreview the file in your editor or use an online Markdown editor to see how these elements are rendered. If they look correct, your Markdown file is working as expected.',
  },
  {
    role: 'assistant',
    content:
      'You now have the instructions on how to create a blank Markdown file. If you have any additional questions or need further assistance, feel free to ask.',
  },
]

const Template = () => {
  return <Messages messages={messages} />
}

export const Chat = Template.bind({})
export const Narrow = () => {
  return (
    <Box sx={{ background: 'red', maxWidth: '400px' }}>
      <Messages messages={messages} />
    </Box>
  )
}
// Narrow.parameters = { layout: 'centered' }
