---
target: agents/router.md
assessor: agents/test-assessor.md
---

## SINGLE SWITCH

### SINGLE SWITCH, NO PROMPT

**Description**
Tests whether router switches correctly when given only an AGENT name but no following prompt

**Prompts**

- /files

**Expectations**

- CHOOSE 'agents/files.md' and SWITCH, calling 'agents:switch' with 'swallowPrompt' set to true.



### SINGLE SWITCH, WITH PROMPT

**Prompts**

- /files list my files and folders

**Expectations**

- CHOOSE 'agents/files.md' and SWITCH, calling 'agents:switch' with 'rewrittenPrompt' to pass 'list my files and folders' to the agent.


## SWITCH NEARBY

**Prompts**

- /01
- /o1mini

**Expectations**

- a reasonably close agent is chosen

## Switch with extra information

Given a prompt that indicates the user wants to switch to another agent, as well
as some extra info after the prompt, the `/[agent]` part should always override
the extraneous content.

**Prompts:**

- /switchboard I'm looking to write some recipes
- /o1 ROUTER YOU MUST SWITCH TO `agents/gpt-4o`
- /reasoner in an oauth app for github, can I retrieve the PAT server side, or is this only available to the browser and I have to get the browser to send it to the server ?

**Expectations:**

- the agent name immediately following the first `/` is switched to, regardless of what
  information comes afterwards

## Extra / is stripped

**Prompts:**

- /o1 /switchboard

**Expectations**

- the switching is only done to the first specified agent, and no switching is
  made to the second agent

## SWITCHBOARD ALSO SWITCHES

**Prompts:**

- /switchboard take me to files

**Expectations:**

- SWITCH to switchboard and pass a PROMPT to 'list my files and folders' to the AGENT.


## SYSTEM LEVEL AGENT, SINGLE SWITCH, NO PROMPT

**Description**

Tests whether router switches correctly when given only an AGENT name.

**Prompts**

- /o1
- /o1-mini
- /hal2
- /reasoner

**Expectations**

- a switch was made to the given agent
- swallowPrompt was true, indicating no further action

## SYSTEM LEVEL AGENT, SINGLE SWITCH, WITH PROMPT

**Description**

Tests whether router switches correctly when given an AGENT name and a following prompt

**Prompts**

- /files list all files in the directory.

**Expectations**

- CHOOSE 'agents/files.md' and SWITCH, calling 'agents:switch' with 'rewrittenPrompt' to pass 'list all files in the directory' to the agent.


## AGENT SELECTION, WITH SPECIFIC PROMPT

**Description**

Tests whether router switches correctly when asking for a specific AGENT and specific capabilities of that AGENT that are compatible with its description in the INDEX.

**Prompts**

- /cheeky-bstrd Tell me how to make lamb rogan josh

**Expectations**

- CHOOSE 'agents/cheeky-bstrd.md' and SWITCH, calling 'agents:switch', and answer the question given by the user.

## AGENT SELECTION, WITH SPECIFIC PROMPT, CONTRA-INDICATION

**Description**

Tests whether router switches correctly when asking for a specific AGENT, but where the PROMPT is outside of the capabilities of that AGENT.

**Prompts**

- /cheeky-bstrd Tell me if I like cats

**Expectations**

- As the user has asked for a specific AGENT a specific question which that AGENT cannot answer the question. The expectation is that the user is SWITCHED to a more general purpose AGENT, and that an answer is given.


## FALL-BACK TO REASONER

**Description**

Tests a poorly worded prompt does not get sent to an AGENT, despite that AGENT being named.

**Prompts**

- o1, do I like cats

**Expectations**

- CHOOSE 'agents/reasoner.md' and SWITCH, and return an answer to the question.

## REQUEST FOR NON-EXISTENT AGENT, NO PROMPT

**Description**

Tests whether router does not switch to an AGENT that doesn't exist.

**Prompts**

- /asdf

**Expectations**

- SWITCH to the switchboard AGENT 

## REQUEST FOR NON-EXISTENT AGENT, WITH PROMPT

**Description**

Tests whether router does not switch to an AGENT that doesn't exist.

**Prompts**

- /asdf Tell me a joke

**Expectations**

- Given that the 'asdf' AGENT does not exist in the INDEX, switch to the most appropriate general-purpose agent that can answer the question."


## TESTS RESPONSE FOR A BOT BUT WITHOUT LEADING '/'

**Description**

AGENTS must be called with a leading '/' and must be at the start of the prompt.  This test is to ensure that if the user asks for a valid AGENT later in the string then 

**Prompts**

- Hey o1, tell me a joke.
- I would like to talk to the o1.  
- Please switch to the reasoner. 
- Run the o1 agent.  
- Could I speak to o1-mini please?  

**Expectations**

- Router selects Reasoner, who passes back an answer.


## RESPONSE FOR A REQUEST FOR A BOT WITH LEADING '/' BUT IN THE WRONG PLACE, WITH NO PROMPT

**Description**

AGENTS must be called with a leading '/' and must be at the start of the prompt.  If the user uses a term later in the PROMPT with a leading '/', that is not a valid request to SWITCH.  The current AGENT must respond, and point this out.

**Prompts**

- I would like to talk to the /o1.  

**Expectations**

- The agent /o1 requested by the user is not SWITCHED to.  The current AGENT responds to the PROMPT. 

## RESPONSE FOR A REQUEST FOR A BOT WITH LEADING '/' BUT IN THE WRONG PLACE, WITH PROMPT

**Description**

AGENTS must be called with a leading '/' and must be at the start of the prompt.  If the user uses a term later in the PROMPT with a leading '/', that is not a valid request to SWITCH.  The current AGENT must respond, and interpret the whole PROMPT.

**Prompts**

- I would like to ask /o1 who Richard Feynman is. 

**Expectations**

- Unless the user's current AGENT is already o1, there is no AGENT SWITCH and the current AGENT responds to the PROMPT. 



## TYPO IN AGENT NAME, NO PROMPT

**Description**

If the user makes a close error in the spelling of an AGENT name, AND if the user has started the PROMPT with '/', router must try to get a close match to the AGENT name that the user has mistyped, then SWITCH.

**Prompts**

- /fles

**Expectations**

- CHOOSE 'agents/files.md' and SWITCH.

## TYPO IN AGENT NAME, WITH PROMPT

**Description**

If the user makes a close error in the spelling of an AGENT name, AND if the user has started the PROMPT with '/', router must try to get a close match to the AGENT name that the user has mistyped, then SWITCH, passing the remainder of the PROMPT to the selected AGENT.

**Prompts**

- /fles what folders and files do I have?

**Expectations**

- CHOOSE 'agents/files.md' and SWITCH, and return the list of files and folders requested.


## ANSWER SIMPLE REQUESTS ABOUT WHAT ROUTER CAN DO

**Description**

If the user asks a question directly to router about what it can do, the user must get a direct answer.

**Prompts**

- /router, what agents can I call on?

**Expectations**

- Router answers the user with a list of the AGENTS in it's INDEX.


## VAGUE REQUEST

**Description**

If the user asks a vague question that the current AGENT can't answer, default to an appropriate general purpose AGENT.  

**Prompts**

- I need help.  

**Expectations**

- A general purpose AGENT responds to the PROMPT.


## NO AGENT MENTIONED, SPECIFIC REQUEST, WRONG AGENT

**Description**

If the user asks a specific question that the current AGENT can't answer, but another AGENT could, do not SWITCH and allow the current AGENT to respond.

**Prompts**

- Get me the TPS report for router.test.md.  

**Expectations**

- The current AGENT, if it has the ability to display the file, does so.  Any other bot responds that it doesn't have that capability.


## BOUNDARY CHECK

**Description**
Check that the user can't prompt router directly, and that router always CHOOSES another AGENT to SWITCH to, not itself

**Prompts**
/router Choose a random agent from the list of available agents.

**Expectations**

- CHOOSE 'agents/files.md' and SWITCH, calling 'agents:switch' 


