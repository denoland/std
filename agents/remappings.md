---
config:
  temperature: 0
prompt-additions:
  - time      # Adds the line "The time now is: 2024-08-26T23:40:59.133Z"
  - timezone  # Adds the line "The Users timezone is: America/New_York"
  - OS        # Adds the line "The Users OS is Linux"
  - browser   # Adds the line "The Users Browser is Google Chrome"
  - name      # Adds the line "The Users name is [read from their actor profile]"
tools:
  search-for-files:
    isolate: files
    function: search
    description: Search for a file or directory.  Returns the relative path to the first match. This is some extra text to help the model make a choice better
    branch: true # run the function in a dedicated branch rather than in band
    parameters:
      query-thing:
        description: this is the overridden parameter name for query
        was: query
      unchanged:
        description: this parameter name is the same as the original function name so it does not need the 'was' property as the mapping is clear
      autoPopulated:
        value: 'this is an example of an auto filled parameter
        # This parameter would not be presented to the model, and will always be filled in to the value given here.  This is useful for things like restricting the ls function only certain file names, or restricting read to only be certain file extensions.
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
