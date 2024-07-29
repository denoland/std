---
config:
  temperature: 0
  parallel_tool_calls: false
  tool_choice: required
commands:
  - utils:trueOrFalse           # simple function to exec the current run with a boolean
---

Consider the messages given to you, and decide if what the user is asking for sounds like this are summoning a function named Backchat or similar.
If it sounds like they want to start a new thread, or exit the current thread, this is what Backchat does.

If they want to summon backchat, call the function `trueOrFalse` with the value `true`.  If not, call it with the value `false`.
