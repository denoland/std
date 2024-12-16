# NAPP Format Specification

**Version:** v1 **Status:** Draft

## Overview

A **NAPP** (Natural Language Application Package) is a structured,
language-agnostic package definition intended for seamless integration between
deterministic code and AI-driven components. The purpose of a NAPP is to provide
a standardized JSON-based configuration file (referred to as the NAPP manifest)
that describes:

- The NAPP’s name, version, and runtime environment
- A set of callable tools and agents (functions, possibly AI-backed)
- Dependencies on other NAPPs
- Evaluations, branding assets, user-facing graphical components, and effects
- Stuck detection and handling configuration

NAPPs are designed to be discovered, understood, and invoked by both humans and
automated systems (including LLMs).

## File Format and Location

A NAPP is described by a single JSON file named `napp.json`—that resides at the
root of a NAPP’s source code repository. This file follows the structure defined
in this specification and must validate against the `nappSchema` as defined
below.

## Top-Level Keys

The top-level NAPP configuration object must contain the following fields:

### Required Fields

- **name** (string):\
  A unique name identifying the NAPP. Typically corresponds to a package name.\
  Example: `"@scope/package-name"`

- **version** (string):\
  The NAPP’s version in semantic versioning format (e.g., `"0.0.1"`).

- **napp-format** (string, must be `"v1"`):\
  Indicates the NAPP specification format version. Currently locked to `"v1"`.

- **runtime** (string):\
  The target runtime environment required to execute the NAPP.\
  Current acceptable values: `"deno"`\
  (Future revisions may allow `"rust"`, `"go"`, `"python"`, etc.)

### Optional Fields

- **description** (string):\
  A human-readable description of the NAPP’s purpose.

- **branding** (string):\
  A path (relative to the NAPP root) to a directory containing branding assets
  (e.g., logos, icons).

- **stucks** (object):\
  Configuration related to stuck detection and handling.\
  See [Stucks Configuration](#stucks-configuration).

- **agent** (object):\
  Defines an AI agent entry point for chat-based invocation of the NAPP.\
  See [Agent Configuration](#agent-configuration).

- **tools** (object):\
  A collection of named tools (functions) that can be invoked by the NAPP or its
  callers.\
  See [Tools Configuration](#tools-configuration).

- **evals** (object):\
  Configuration for evaluation/test runners.\
  See [Evals Configuration](#evals-configuration).

- **dependencies** (object):\
  References to other NAPPs this NAPP depends on.\
  See [Dependencies](#dependencies).

- **graphics** (object):\
  Configuration describing visual, interactive components (widgets) that can be
  displayed.\
  See [Graphics Configuration](#graphics-configuration).

- **effects** (object):\
  Configuration for side-effect hooks that run on mount/unmount.\
  See [Effects Configuration](#effects-configuration).

## Detailed Field Specifications

### Stucks Configuration

**Key:** `stucks`

**Structure:**

- `napp` (string): A reference to another NAPP (in `@artifact/name` format) that
  provides stuck-detection functionality.
- `tool` (string): The name of the tool within the referenced NAPP to invoke for
  stuck handling.
- `parameters` (object):
  - `title` (string): Title describing the stuck scenario.
  - `description` (string): Detailed description of the stuck scenario.
  - `snapshotId` (string): Identifier for the current snapshot/state.
  - `crypto` (string): A cryptographic or unique ID tying this stuck to a
    particular revision or repository.
  - `branch` (string): The branch name relevant to this stuck scenario.
  - `expections` (array of strings): A list of expected conditions or anomalies.

**Example:**

```json
"stucks": {
  "napp": "@artifact/stucks",
  "tool": "create",
  "parameters": {
    "title": "This is the title of the stuck",
    "description": "This is the description of the stuck",
    "snapshotId": "snapshot-id",
    "crypto": "crypto-id",
    "branch": "main",
    "expections": ["Mrs Miggins should have two pies, not one"]
  }
}
```

### Agent Configuration

**Key:** `agent`

Defines an agent endpoint that can be queried with natural language to produce
responses (and possibly file outputs).

**Structure:**

- `napp` (string, `@artifact/name`): Reference to a NAPP providing the agent
  logic.
- `tool` (string, optional): The entry point tool of the agent NAPP if not using
  the default.
- `parameters` (object):
  - `model` (string): The model or variant of the AI backend to use.
  - `parallel_tool_calls` (boolean): Whether the agent can make tool calls in
    parallel.
  - `stop_on_tools` (array of strings): A list of tool names that, if called,
    cause the agent to stop execution.
  - `tools` (array of strings): A list of tool names that the agent can call.\
    If omitted, defaults to the current NAPP’s tools.
  - `instructions` (string, optional): A path to a file with agent instructions.

**Example:**

```json
"agent": {
  "napp": "@artifact/openai",
  "tool": "some-exported-function",
  "parameters": {
    "model": "gpt-4o",
    "parallel_tool_calls": false,
    "stop_on_tools": ["tool1", "tool3"],
    "tools": ["some-function"],
    "instructions": "instructions.md"
  }
}
```

### Tools Configuration

**Key:** `tools`

A mapping of tool names to their definitions. Each tool:

- May directly define a function (with parameters, return types, etc.)
- May reference another NAPP’s tool(s)
- May pass-through or wrap another NAPP’s tool with modified parameters.

**Structure (for each tool key):**

- If a string is provided and matches `@artifact/name`, the tool is a reference
  to another NAPP’s agent or tool.
- Otherwise, an object with keys:
  - `napp` (optional, string): Reference to a NAPP providing the tool.
  - `tool` (optional, string): Name of the tool in the referenced NAPP.
  - `description` (optional, string): Human-readable description of the tool.
  - `parameters` (optional, object): JSON schema describing the tool’s input
    parameters.
    - `type` must be `"object"` if present.
    - `properties` is a map of parameter names to schema definitions.
    - `required` is an array of parameter names that are required.
  - `returns` (optional, object): JSON schema describing the tool’s return
    value.
  - `throws` (optional, object): Map of error names to error handling metadata.
  - `path` (optional, string): A path to a local file implementing the tool
    function. If omitted, the default export from the NAPP runtime must provide
    the tool logic.

**Example:**

```json
"tools": {
  "some-function": {
    "description": "This function does something",
    "parameters": {
      "param1": {
        "description": "This is the first parameter",
        "type": "string",
        "required": true
      },
      "param2": {
        "description": "This is the second parameter",
        "type": "number",
        "required": false
      }
    },
    "returns": {
      "description": "The return of the function",
      "type": "string"
    },
    "throws": {
      "FileNotFoundError": {}
    },
    "path": "./path/to/function.ts"
  },
  "some-other-function": "dependent-napp-name"
}
```

### Evals Configuration

**Key:** `evals`

Specifies a test runner NAPP and configuration for verifying NAPP functionality.

**Structure:**

- `napp` (string): A NAPP name or reference that runs tests.
- `parameters` (object):
  - `files` (array of strings): Paths to test files.

**Example:**

```json
"evals": {
  "napp": "napp-test-runner-name",
  "parameters": {
    "files": ["tests/test1.json", "tests/test2.json"]
  }
}
```

### Dependencies

**Key:** `dependencies`

A map from dependency names to objects specifying version and optional name
overrides.

**Structure (for each dependency key):**

- `name` (string, optional): The actual package name if different from the key.
- `version` (string): The version of the dependency NAPP.

**Example:**

```json
"dependencies": {
  "dependent-napp-name": {
    "version": "0.0.1"
  },
  "napp-test-runner-name": {
    "name": "@artifact/evals",
    "version": "0.0.1"
  }
}
```

### Graphics Configuration

**Key:** `graphics`

A collection of graphical components (widgets) that can be displayed on a
stateboard or UI dashboard.

**Allowed forms:**

1. A direct reference to another NAPP’s graphics element
   (`"@artifact/some-napp"`).
2. A react component definition with `type: "react"`.
3. A passthrough that references another NAPP’s graphics and optionally renames
   it.

**Structure:**

- React component definition:
  - `type` = `"react"`
  - `path` (optional, string): Path to the React component source file.
  - `parameters` (optional, object): Schema for configurable props.
- NAPP reference:
  - `napp` (string): `@artifact/other-napp`
  - `graphics` (string, optional): Name of the graphics component in the other
    NAPP.

**Example:**

```json
"graphics": {
  "googleMapsViewer": {
    "type": "react",
    "path": "./path/to/component.tsx",
    "parameters": {
      "zoomLevel": {
        "type": "number",
        "description": "Zoom level of the map",
        "required": true
      }
    }
  },
  "truckRoutes": "@artifact/truck-routes",
  "weatherDisplay": {
    "napp": "@artifact/weather",
    "graphics": "weatherDisplayInCelsius"
  }
}
```

### Effects Configuration

**Key:** `effects`

Specifies lifecycle hooks that run when a NAPP is mounted or unmounted. These
are tool invocations that may produce side effects.

**Structure:**

- `mount` (optional, object): A tool definition (same structure as in `tools`)
  used to set up side effects.
- `unmount` (optional, object): A tool definition used to clean up side effects.

**Example:**

```json
"effects": {
  "mount": {
    "napp": "@artifact/side-effects",
    "tool": "setup"
  },
  "unmount": {
    "napp": "@artifact/side-effects",
    "tool": "cleanup"
  }
}
```

## Validation Rules

- **Names and References:**
  - The `name` field must be a simple string, not referencing itself with
    `@artifact/name` style.
  - All referenced NAPPs (e.g., in `tools`, `dependencies`, `stucks`, `agent`,
    `graphics`) must adhere to the `@namespace/name` format if pointing to
    external NAPPs.
  - Self-references to the current NAPP by its own name in dependencies or tools
    are not allowed.

- **Schema Compliance:**
  - Parameters, returns, and throws objects must conform to JSON schema-like
    structures as outlined in the examples.
  - The `napp-format` must be `"v1"`.

- **Runtime Requirements:**
  - The `runtime` field currently only supports `"deno"` in this version.

## Checks Before Publishing

Implementations should verify:

1. **Name and Version Match:** Confirm `name` and `version` fields are
   consistent and correct.
2. **NAPP Schema Validation:** The entire JSON must validate against the
   `nappSchema`.
3. **Branding Files:** If `branding` is specified, ensure referenced files exist
   and are hashable.
4. **Tools Resolution:** All `tools` must be resolvable, meaning their `path` or
   referenced NAPP/tool must exist.
5. **Parameter Matching:** Tool parameters must match the function signatures at
   runtime.
6. **NAPP References in Dependencies:**
   - Ensure that dependencies listed in `dependencies` are available.
   - If using a runtime requiring import maps, ensure these dependencies are
     reflected in import maps.
7. **No Self-Reference:** The NAPP must not reference itself as a dependency or
   as a foreign resource.

## Example

See `napp-example.jsonc` for a complete annotated example.

## Extensibility

Future versions of this specification may introduce:

- Additional runtimes (Python, Go, Rust).
- Enhanced validation for parameter schemas.
- Support for environment-specific overrides (mock, test, prod).
- Failover and retry configurations for gateway calls.

## Questions for Clarification

- Are there any constraints on allowed runtimes beyond `deno`?
- Should we support additional `napp-format` versions in the future (e.g.,
  `v2`)?
- Is there a standard way to handle environment-based configuration overrides?

_(Please provide feedback or clarifications as needed.)_

---

**End of Specification**
