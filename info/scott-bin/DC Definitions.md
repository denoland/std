# Dreamcatcher Framework Rules

# TABLE OF CONTENTS

    1. ENTITIES
    2. DEFINITIONS OF ACTIONS AVAILABLE
    3. NOUN DEFINITIONS
    4. SYSTEM FRAMEWORK
    5. TEMPLATES
    6. ENTITY RELATIONSHIP DIAGRAM

## ENTITIES

- DAVE:\
  **Description** The human user. DAVE may rename himself and, if so, retains
  the same Actions Available. DAVE cannot rename himself if the new name is the
  same or close to any other definition provided. **Actions Available** - PROMPT
  - TASK HAL - Receive RESPONSE from HAL - Take a STATEBOARD_ACTION

- HAL: **Description** An AGENT that can ORCHESTRATE other AGENTS to carry out a
  TASK requested by DAVE. **Actions Available** - ORCHESTRATE - PROMPT AGENTS or
  DRONES - Send RESPONSES directly to DAVE and STATEBOARD. - SEND RESPONSES to
  AGENTS and DRONES - Can trigger COMMAND_EXECUTION available from their
  BOT_DEFINITION

- AGENT: **Description** An INSTANTIATION that can be uniquely identified.\
  **Actions Available** - PROMPT AGENTS or DRONES - Complete TASKS - TASK AGENTS
  and DRONES (within the limits of their system prompt) - SEND RESPONSES to
  other AGENTS and DRONES - Can trigger COMMAND_EXECUTION available from their
  BOT_DEFINITION

- TOOL: **Description** An executable software component that performs
  COMMAND_EXECUTION when called upon by HAL or an AGENT. **Actions Available** -
  Execute COMMANDS - Return RESPONSES

- DRONE:\
  **Description** A INSTANTIATION of a BOT_DEFINITION that, having been
  INSTANTIATED, can be uniquely identified. **Actions Available** - SEND
  RESPONSES to other AGENTS and DRONES that have TASKed them. - Can trigger
  COMMAND_EXECUTION available from their BOT_DEFINITION

- ISOLATE: **Description** Traditional code executed by HAL, an AGENT, or a
  DRONE. COMMANDS are sent to ISOLATES for execution. **Actions Available**
  - Run COMMANDS.

- AI_MODEL: **Description** An external service used to INSTANTIATE and RUN HAL,
  AGENTS and DRONES, and RUN TASKS. **Actions Available**
  - INSTANTIATE HAL, an AGENT, or a DRONE using a BOT_DEFINITION.

- ARTIFACT: **Description** The operating system. **Actions Available**
  - Grant or deny PERMISSION for an ACTION AVAILABLE to an ENTITY.
  - RUN COMMAND_EXECUTIONS.

## DEFINITIONS OF ACTIONS AVAILABLE

- PROMPT: Input via voice, text, or uploaded files.

- RESPONSE: An output following a call to AI_MODEL. from an AGENT, HAL or DRONE
  sent back to the AGENT, HAL or DRONE that gave it that TASK.

- STATEBOARD_ACTION: An action initiated by interacting with the STATEBOARD.
  STATEBOARD_ACTIONS can call COMMAND_EXECUTION or TASKS.

- COMMAND_EXECUTION: The request to an ISOLATE to run a piece of code.

- INSTANTIATE: The creation of an running instance of HAL, an AGENT or a DRONE
  by creating a BOT_DEFINITION, using the BOT_TEMPLATE, based on the intended
  use.

- DEINSTANTIATE: to delete an INSTANTIATED AGENT or DRONE. Generally used when
  BOT_TEMPLATES are updated while INSTANTIATED AGENTS or DRONES are extant, and
  when DRONES complete their TASK.

- TASK: A request for INFO, an ACTION or an TRANSMISSION.

- ORCHESTRATE: Considering the THREAD, INTENT, CAPABILITIES and AGENTS
  available, the act of planning and executing steps necessary to achieve the
  appropriate output for DAVE's last PROMPT

## NOUN DEFINITIONS:

- PERMISSION: On HAL, AGENTS and DRONES requesting a TASK, PERMISSION is a
  yes/no returned by ARTIFACT.

- INTENT: The high-level outcome that DAVE wants HAL to achieve. HAL generates
  INTENT based on the THREAD conversation. INTENT can be used to gain additional
  context beyond the last PROMPT.

- INFO: A RESPONSE, in natural language, that does not result in a STATE_CHANGE.

- ACTION: A COMMAND_EXECUTION that results in a STATE_CHANGE.

- TRANSMISSION: A RESPONSE, typically in a set format such as JSON or Markdown,
  that is intended to be consumed and presented by HAL, an AGENT or a DRONE.

- STATE_CHANGE: A file operation (create, read, update, delete) on files within
  the SYSTEM FRAMEWORK that DAVE has PERMISSION to access.

- COMMAND: Within a BOT_TEMPLATE or BOT_DEFINITION, a COMMAND is a link to a
  piece of executable software available to HAL, and AGENT or DRONE that carries
  out a COMMAND_EXECUTION when called on. COMMANDS carry out a single purpose,
  typically a STATE_CHANGE.

- INSTANTIATION: A running AGENT derived from a BOT_TEMPLATE and, optionally,
  CAPABILITIES.

## SYSTEM FRAMEWORK:

- HAL_TEMPLATE: A text file that defines the structure of HAL. See below for
  more details.

- BOT_TEMPLATE: A text file that defines the structure of an AGENT or DRONE, to
  which CAPABILITIES can be added. See below for more details.

- BOT_DEFINITION: A text file containing instructions that define the behavior
  of HAL, AGENTS and DRONES, guiding their operations, interactions, and
  RESPONSES.

- FOLDER_STRUCTURE: A description of which folders and files are available, a
  description of what each type of file or folder is for, and which can be used
  to discern the data to act on. The FOLDER_STRUCTURE is controlled by ARTIFACT.

- STATEBOARD: A visual interface that helps DAVE understand HAL's RESPONSES,
  enabling STATEBOARD_ACTIONS or facilitating PROMPTS.

- CAPABILITY: A text file, which can only be used as a sub-section of a
  BOT_DEFINITION, that when included with a BOT_DEFINITION provides the
  INSTANTIATED AGENT or DRONE with additional functions. Note, the presence of a
  CAPABILITY within a BOT_DEFINITION does not imply PERMISSION to use it.

- CAPABILITY_TEMPLATE: A text file denoting the template to use when creating a
  new CAPABILITY.

- PREFERENCES: A list or natural language collection of preferences as to how
  DAVE would like to interact with HAL. Note, PREFERENCES cannot override
  PERMISSION or PRIORITY.

- THREAD: The PROMPT/RESPONSE record of interaction between DAVE and HAL.

- LIBRARY: A list of CAPABILITIES available to be used in the construction of a
  BOT_DEFINITION.

- STUCK: A bug, problem or request by DAVE for a CAPABILITY that doesn't exist.
  Once solved, a STUCK becomes a CAPABILITY.

- STUCK LIBRARY: A list of STUCKS yet to be solved.

## TEMPLATES

### TERMS USED in TEMPLATES

The following are additional definitions used within a BOT_DEFINITION.

- CONFIG: ARTIFACT level control over how this INSTANTIATED AGENT, HAL or DRONE
  calls COMMANDS.
- GLOBAL_DEFINITIONS: A list of Definitions that supersede any other definitions
  you may have. The HAL, the AGENT or DRONE must use these at all times.
- GLOBAL_RULES: A list of Rules that must always be adhered to, and supersede
  any other rules.
- LOCAL_DEFINITIONS: A list of Definitions that have specific meaning when used
  within this BOT. They are overridden by PRIORITY_DEFINITIONS. If similar words
  are used that match the descriptions of the words in LOCAL_DEFINITIONS, then
  use the specific word that matches and carry on.
- LOCAL_RULES: A list of Rules that the AGENT or DRONE must follow, unless they
  interfere or are inconsistent with GLOBAL_RULES.
- OVERVIEW: A Natural Language description of what this AGENT or DRONE does
- IDENTITY: A description of who this AGENT or DRONE is and how it should
  behave.
- OBJECTIVE: A description of what this AGENT or DRONE is to do.
- PROCESS: A description of how this AGENT or DRONE should achieve its OBJECTIVE
- RESULT: What is expected after the AGENT or DRONE has a RESPONSE. May include
  example formats to constrain the syntax. May also include guidelines on
  handling errors.
- EXAMPLES: A helpful example of the output required if given a TASK.

### BOT_TEMPLATE

When HAL, an AGENT or a BOT is INSTANTIATED, a BOT_DEFINITION is compiled and
stored as a file. The structure of that file is as follows:

    - BOT_ID
    - CONFIG: <Required>
    - COMMANDS: <Required>
    - OVERVIEW: <Optional>
    - PRIORITY_DEFINITIONS <Required>
    - LOCAL_DEFINITIONS <Optional>
    - GLOBAL_RULES: <Required>
    - LOCAL_RULES <Optional>
    - IDENTITY <Required>
    - OBJECTIVE: <Required>
    - PROCESS: <Required>
    - RESULT: <Required>
    - EXAMPLES: <Optional>
    - CAPABILITY: <Optional> If no CAPABILITIES are provided, the AGENT uses the bare AI_MODEL without further system prompting.  NOTE: a BOT_DEFINITION can have more than one CAPABILITY.

### DAVE_TEMPLATE:

    - ID: <Required> Unique ID within the Dreamcatcher System
    - Identity: <Required> E.g. Dave's personal account details
    - Preferences: <optional>
    - Personal Folder Structure: <Required>

### HAL_TEMPLATE:

    - ID: <Required>
    - DAVE_ID: <Required> The owner of this HAL.  A link to the ID of DAVE who has sole control over this particular HAL.
    - THREAD: <Required> Provided by ARTIFACT, a list of hashes that link to previous conversations and STATES between HAL and DAVE.
    - INSTANTIATED AGENT list: <Optional> A list of running AGENTS generated by HAL on DAVE's requests.
    - LIBRARY: <Required> See above.
    - STUCK LIBRARY: <Required> See above
    - Live AGENTS: List of previously INSTANTIATED AGENTS that were INSTANTIATED by this DAVE identified through DAVE_ID.

### CAPABILITY_TEMPLATE:

    - CAPABILITY_ID
    - CONFIG: <Required>
    - COMMANDS: <Required>
    - OVERVIEW: <Optional>
    - PRIORITY_DEFINITIONS <Required>
    - LOCAL_DEFINITIONS <Optional>
    - GLOBAL_RULES: <Required>
    - LOCAL_RULES <Optional>
    - IDENTITY <Required>
    - OBJECTIVE: <Required>
    - PROCESS: <Required>
    - RESULT: <Required>
    - EXAMPLES: <Optional>

napp weather napp weather manifest agent weather

### NAPP Manifest

### NAPP Manifest

Defined as package that bridges NL to code using the following:

    - TOOLS: <Required>    Source code.      
    Description of what you can do.
    Knowledge base (topic knowledge)  Some base knowledge and one Agent file.
    - TESTS
        Test files
        TPS
    - Advertisement of SOA type thing.

    - Agent file
        ---
            - TOOLS INTERFACE e.g. JSON - classical
            - NAPP INTERFACE NL PROMPT/RESPONSES
                weather napp
                sandwich napp
                golf napp
            - Model choice
            - Model config
        ---

        - Instructions 
            How to carry b ook a business day that not raining, has sandwiches and we play golf.

### BOT file

Agent file instructions layer

## ENTITY RELATIONSHIP DIAGRAM

flowchart TD

%% Entities

DAVE["**DAVE**<br/> **Actions Available:**<br/> • PROMPT<br/> • TASK HAL<br/> •
Receive RESPONSE from HAL<br/> • Take a STATEBOARD_ACTION<br/> "]

HAL["**HAL**<br/> A privileged AGENT that directly interacts with DAVE.<br/>
**Actions Available:**<br/> • PROMPT AGENTS or DRONES<br/> • Send RESPONSES
directly to DAVE and STATEBOARD<br/> • SEND RESPONSES to AGENTS and DRONES<br/>
• Can trigger COMMAND_EXECUTION available from their BOT_DEFINITION<br/> "]

AGENT["**AGENT**<br/> An INSTANTIATION of a BOT_DEFINITION, uniquely
identified.<br/> **Actions Available:**<br/> • PROMPT AGENTS or DRONES<br/> •
Complete TASKS<br/> • TASK AGENTS and DRONES (within system prompt limits)<br/>
• SEND RESPONSES to other AGENTS and DRONES<br/> • Can trigger COMMAND_EXECUTION
available from their BOT_DEFINITION<br/> "]

DRONE["**DRONE**<br/> An INSTANTIATION of a BOT_DEFINITION, uniquely
identified.<br/> **Actions Available:**<br/> • SEND RESPONSES to AGENTS and
DRONES that have TASKed them<br/> • Can trigger COMMAND_EXECUTION available from
their BOT_DEFINITION<br/> "]

ISOLATE["**ISOLATE**<br/> Traditional code executed by HAL, AGENT, or
DRONE.<br/> COMMANDS are sent to ISOLATES for execution.<br/> **Actions
Available:**<br/> • Run COMMANDS<br/> "]

AI_MODEL["**AI_MODEL**<br/> External service used to INSTANTIATE and RUN HAL,
AGENTS, and DRONES<br/> Runs TASKS<br/> **Actions Available:**<br/> •
INSTANTIATE HAL, an AGENT, or a DRONE using a BOT_DEFINITION<br/> "]

ARTIFACT["**ARTIFACT**<br/> The operating system<br/> **Actions
Available:**<br/> • Grant or deny PERMISSION for an ACTION AVAILABLE to an
ENTITY<br/> • RUN COMMAND_EXECUTIONS<br/> "]

STATEBOARD["**STATEBOARD**<br/> Visual interface that helps DAVE understand
HAL's RESPONSES<br/> Enables STATEBOARD_ACTIONS or facilitates PROMPTS<br/> "]

THREAD["**THREAD**<br/> The PROMPT/RESPONSE record of interaction between DAVE
and HAL<br/> "]

COMMAND["**COMMAND**<br/> Link to executable software within a BOT_TEMPLATE or
BOT_DEFINITION<br/> Available to HAL, AGENT, or DRONE<br/> Carries out a
COMMAND_EXECUTION when called<br/> "]

TASK["**TASK**<br/> A request for INFO, an ACTION, or a TRANSMISSION<br/> "]

PERMISSION["**PERMISSION**<br/> Yes/No returned by ARTIFACT when HAL, AGENT, or
DRONE requests a TASK<br/> "]

STATEBOARD_ACTION["**STATEBOARD_ACTION**<br/> Action initiated by DAVE
interacting with the STATEBOARD<br/> Can call COMMAND_EXECUTION or TASKS<br/> "]

%% Relationships

%% DAVE Interactions DAVE -->|PROMPT| HAL DAVE -->|TASKs| HAL DAVE -->|Receives
RESPONSE from| HAL DAVE -->|Takes| STATEBOARD_ACTION DAVE -->|Interacts with|
STATEBOARD DAVE -->|Has| PREFERENCES DAVE -->|Engages in| THREAD

%% HAL Interactions HAL -->|Sends RESPONSE to| DAVE HAL -->|Updates| STATEBOARD
HAL -->|PROMPTs| AGENT HAL -->|PROMPTs| DRONE HAL -->|Sends RESPONSES to| AGENT
HAL -->|Sends RESPONSES to| DRONE HAL -->|Can trigger| COMMAND_EXECUTION HAL
-->|Requests PERMISSION from| ARTIFACT HAL -->|Uses| AI_MODEL HAL -->|Uses|
BOT_DEFINITION HAL -->|Uses| COMMANDS

%% AGENT Interactions AGENT -->|PROMPTs| AGENT AGENT -->|PROMPTs| DRONE AGENT
-->|TASKs| AGENT AGENT -->|TASKs| DRONE AGENT -->|Sends RESPONSES to| AGENT
AGENT -->|Sends RESPONSES to| DRONE AGENT -->|Completes| TASKS AGENT -->|Can
trigger| COMMAND_EXECUTION AGENT -->|Requests PERMISSION from| ARTIFACT AGENT
-->|Uses| AI_MODEL AGENT -->|Uses| BOT_DEFINITION AGENT -->|Uses| COMMANDS

%% DRONE Interactions DRONE -->|Sends RESPONSES to| AGENT DRONE -->|Sends
RESPONSES to| DRONE DRONE -->|Can trigger| COMMAND_EXECUTION DRONE -->|Requests
PERMISSION from| ARTIFACT DRONE -->|Uses| AI_MODEL DRONE -->|Uses|
BOT_DEFINITION DRONE -->|Uses| COMMANDS

%% ISOLATE Interactions COMMAND -->|Is sent to| ISOLATE ISOLATE -->|Executes|
COMMANDS

%% AI_MODEL Interactions AI_MODEL -->|INSTANTIATES| HAL AI_MODEL
-->|INSTANTIATES| AGENT AI_MODEL -->|INSTANTIATES| DRONE

%% ARTIFACT Interactions ARTIFACT -->|Grants or Denies| PERMISSION ARTIFACT
-->|Runs| COMMAND_EXECUTION

%% THREAD Interactions THREAD -->|Records| PROMPT THREAD -->|Records| RESPONSE

%% STATEBOARD_ACTION Interactions STATEBOARD_ACTION -->|Registered by| ARTIFACT
STATEBOARD_ACTION -->|Can call| COMMAND_EXECUTION STATEBOARD_ACTION -->|Can
call| TASK

%% PROMPT and RESPONSE HAL -->|Processes| PROMPT HAL -->|Generates| RESPONSE
AGENT -->|Processes| PROMPT AGENT -->|Generates| RESPONSE DRONE -->|Generates|
RESPONSE

%% TASK Interactions DAVE -->|Requests| TASK HAL -->|Handles| TASK AGENT
-->|Handles| TASK DRONE -->|Handles| TASK
