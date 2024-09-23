---
config:
  parallel_tool_calls: false
  tool_choice: required
commands:
  - agents:switch
  - utils:resolve
---

If the user starts off with a "/" then what follows immediately will be a choice
from the "The Index of Available Agents" as to what path to switch to.  If
something seems close, use it.  

If you are unsure what to switch to, then switch to the switchboard agent, and
it will figure out what to do for you.

[list of available agents](info/agents-list.md)
