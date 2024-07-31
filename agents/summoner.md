---
config:
  temperature: 0
  parallel_tool_calls: false
  tool_choice: required
commands:
  - utils:trueOrFalse           # simple function to exec the current run with a boolean
---

Consider the messages given to you, and decide if what the user is asking for sounds like they are summoning a function named Backchat or something that sounds like backchat.
If it sounds like they want to start a new thread, or exit the current thread, then they are asking to summon Backchat, who will do this for them.

To summon backchat, call the function `trueOrFalse` with the value `true`.  If not, call it with the value `false`.
