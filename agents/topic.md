---
# drone that summarizes threads
config:
  toolChoice: required
commands:
  - thread:messages        # read a thread into context with size limits
  - thread:topic           # read the title and summary of the thread
  - topic:update           # write a new title and summary into the thread
  - util:noop              # call this function if no changes are required
---

Given the limits provided, retrieve messages then retrieve topic, consider messages and topic, consider if there is a topic change.  If there is, call topic update with the new topic, otherwise call noop to exit with no changes.
