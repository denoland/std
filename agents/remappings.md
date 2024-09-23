---
config:
  temperature: 0
state:
  switchboard # load up a slice of the state into the agent every time
files:
  some/file/to/load.json # load up a file into the agent.
  # or use links to load up arbitrary data into the agent.
  # could add paths within a file, and us pid addressing.
  # use this method to load time and browser fingerprint.

stateboard: true # indicate that this sysprompt is stateboard aware ?
# Or, allow using the isolate links function to read in the stateboard contents

tools:
  search-for-files:
    isolate: files
    function: search
    description: Search for a file or directory.  Returns the relative path to the first match. This is some extra text to help the model make a choice better
    branch: true | daemon # run the function in a dedicated branch rather than in band, or keep it open after origin is replied to
    stopOnTool: true  # should calling this tool stop agent execution ?
    parameters:
      query-thing:
        description: this is the overridden parameter name for query
        was: query
      unchanged:
        description: this parameter name is the same as the original function name so it does not need the 'was' property as the mapping is clear
      autoPopulated:
        value: this is an example of an auto filled parameter
        # This parameter would not be presented to the model, and will always be filled in to the value given here.  This is useful for things like restricting the ls function only certain file names, or restricting read to only be certain file extensions.
      hidden:
        was: notHidden
        # given an optional parameter, it can be removed from sight to avoid confusion in the AI
---

This is a test file used to test the mappings between functions in isolates and
the json schema definitions that are passed to AI models.

If not specified in the mapping then the defaults will be used, but this just
lets you add prompting text to change what the display will show.

When the parameters are overridden, the names are mapped, and any There must not
be a collision with a named parameter and an override, as in the resolved
parameters list cannot contain duplicates.

Changing types doesn't really work, so the type has to be identical.

If the rename and the new name are identical, do not need the was.

Need a bot that knows about the format of the frontmatter, so it can give
examples and advice while editing, and it can check if the names match. Needs
the isolate ls function inside it.

Then in the agent display panel we show the params that have renamed, and
possibly the original function descriptions. Show the resolved tools inputs, and
show what the original and the modified versions are.

Can only change the names and descriptions of the function calls and their
parameters.

Creator bot would be able to alter these descriptions.

## Specifying a function to be loaded

[isolate:meow](isolate://isolateName/someFunction/{ask:true})

This should not require it to be an action, or else we have to stall the agent ?
This should be an instantly returning function ? Could be how we insert the time
in the agents. Should be perfectly repeatable as a function. If the function
calls other acitons, then this is fine.

If you think the user is in another timezone, use that, but otherwise the time
now is: [asdfasdf](isolate://utils/now/{timezone:0})

What is the weather: [asdfasdf](isolate://utils/now/{timezone:0})

## Multiple agents

Be able to specify a glob pattern for the agents, so that the test runs for
multiple agents
