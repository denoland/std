# Project Map Instructions

**Purpose:**\
`PROJECT_MAP.md` provides a high-level map of the project’s structure, purpose,
and key components. It helps new contributors quickly understand the overall
layout and logic without too much detail.

**Key Rules:**

- Start at `📦 PROJECT_ROOT/`.
- Organize top-level folders and files first, with important items at the top.
- Place `dependencies` at the bottom, with `vendor-docs` above it if it exists.
- Notation:
  - `📦` for the root project
  - `📂` for directories
  - `📄` for files
  - `🧩` for dependent projects
- Under each file, list:
  - Exported functions for code files, including their TS parameter/return
    types.
  - Top-level sections for knowledge files.
  - All tests for test files.
- Add a short rationale note (`ℹ`) beneath each item.
- Skip low-level internal files that aren’t architecturally important.
- Exclude `PROJECT_MAP.md` from its own map.

**Structure Example:**

```text
📦 PROJECT_ROOT/
├─ 📂 src
│  ├─ 📄 main.ts
│  │   ℹ Entry point for CLI
│  │   1. runCLI(args: string[]): Promise<number>
│  │      ℹ Parses CLI arguments, executes workflow, returns exit code
│  ├─ 📄 utils.ts
│  │   ℹ Shared utilities
│  │   1. formatOutput(input: string): string
│  │      ℹ Formats CLI output for readability
│  │   2. handleError(error: Error): void
│  │      ℹ Centralized error handling
│  └─ (Internal helper files omitted)
├─ 📂 tests
│  ├─ 📄 main_test.ts
│  │   ℹ Tests runCLI()
│  │   1. testRunCLI_withValidArgs()
│  │      ℹ Ensures runCLI() processes valid args correctly
│  │   2. testRunCLI_withInvalidArgs()
│  │      ℹ Verifies runCLI() handles invalid args gracefully
│  ├─ 📄 utils_test.ts
│  │   ℹ Tests utils.ts functions
│  │   1. testFormatOutput_valid()
│  │      ℹ Checks correct string formatting
│  │   2. testHandleError_logsProperly()
│  │      ℹ Confirms handleError() logs error details as expected
├─ 📄 README.md
│   ℹ Quick start and top-level overview
│   1. Introduction
│   │  ℹ Brief project summary
│   2. Installation
│   │  ℹ Setup steps
│   3. Usage
│      ℹ Basic runtime instructions
├─ 📂 vendor-docs
│  ℹ External dependency documentation
│  └─ 📄 commander/
│     ℹ Docs for the `commander` CLI library
└─ 📂 dependencies
   ├─ 📦 @babel/parser
   │   ℹ Parses embedded JSON in scripts
   ├─ 📦 commander
   │   ℹ CLI argument parsing library
   └─ 🧩 subproject1
       ℹ Integrated dependent project
```

**Why This Format?**

- Using `ℹ` notes and uniform structure allows automated extraction and
  filtering of both structural and rationale information.
- Explicit TS types for functions clarify inputs and outputs.
- Listing all tests under each test file ensures a complete snapshot of the
  project’s verification points.
- This approach keeps the overview clean, easy to maintain, and useful at any
  level of detail.
