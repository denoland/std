# PROJECT_MAP_INSTRUCTIONS

**Motivation:**\
A well-structured overview file named `PROJECT_MAP.md` **must** provide a
top-level, maintainable map of your project—whether it's a codebase or a
knowledge base. It **must** highlight the purpose of key components, how they
connect, and why they exist, without getting lost in the details. This
high-level perspective **must** make onboarding easier, streamline maintenance,
and ensure everyone stays aligned on the overall structure.

**How to Create a PROJECT_MAP.md file:**

1. **Establish the Hierarchy:**
   - You **must** begin at the project’s **root** (e.g., `📦 PROJECT_ROOT/`).
   - You **must** organize by **folders**, **files**, placing the most important
     items nearer the top.
   - **dependent projects** and **code package dependencies** must be listed
     under a dedicated `dependencies` directory at the bottom of the hierarchy,
     with the `vendor-docs` above it, if present.

2. **Notation and Sections:**
   - Represent **projects** with `📦`, **directories** with `📂`, **files** with
     `📄`, and **dependent projects** (non-package dependencies) with `🧩`.
   - Under each file, use numbered bullets (`1.`, `2.`, etc.) for individual
     **sections**, **functions**, or **tests**.
   - Each item (file, function, or test) **should** have a **rationale note**
     (`ℹ`) beneath it, explaining its purpose or relevance.
     - For **code files**: You **must** only list exported functions. You
       **should** place a rationale note under each function.
     - For **test files**: You **must** list each test as a bullet, with a
       rationale note explaining which function it tests and why.
     - For **knowledge files**: You **must** list top level topics or sections,
       each with a rationale note.

3. **High-Level Focus and Omissions:**
   - Do **not** include `PROJECT_MAP.md` itself in the diagram—it’s a
     meta-document, not part of the structure.
   - You **must** omit minor internal files that serve only private,
     non-architectural roles to keep the map concise.
   - Include **dependencies** and **subprojects** by listing them under a
     dedicated `dependencies` directory.
   - If there is a `vendor-docs` directory, list only the folders in this
     directory, and use the rationale doc to state which dependency the
     documentation is for.

4. **Clarity Over Detail:**
   - The goal is to provide a meaningful overview. Avoid overly detailed
     breakdowns.
   - Instead of a large rationale at the start of a file, give short, focused
     rationale notes per listed item.

5. **Maintain and Update:**
   - Refresh this map as your structure changes, ensuring it remains accurate
     and useful.

---

**Nested Project Structures and Reasoning Extraction:**

- **Consistent Reasoning Format:**\
  By maintaining a uniform rationale format (`ℹ` notes), you enable programmatic
  extraction of reasoning data. This uniformity lets you:
  - Aggregate rationales from dependent or nested projects into a combined
    overview.
  - Filter rationales by topic, file, or function, tailoring the depth of
    understanding as needed.

- **Nesting and Dependencies:**\
  If your project includes **nested subprojects** or **dependencies** that
  follow the same `PROJECT_MAP.md` convention, you can:
  - **Depth-Limited Views:** Show only top-level items of dependencies, or go
    deeper if required.
  - **Selective Inclusion:** Filter out less critical subprojects or only show
    certain directories.
  - **Reasoning-Only Extraction:** Pull out just the `ℹ` lines (and associated
    bullets) from dependent `PROJECT_MAP.md` files, building a reasoning-only
    summary across multiple codebases.

- **Navigation and Filtering Tools:**\
  With a consistent structure:
  1. Tools can traverse directories and files systematically.
  2. Rationales can be extracted to produce filtered views (e.g., a
     "reasoning-only" document, "top-level-overview" view, or "tests-only"
     summary).
  3. Users can dynamically adjust depth, viewing a high-level map or drilling
     into detailed architecture.

---

**Example PROJECT_MAP.md file:**

```text
📦 PROJECT_ROOT/
├─ 📂 reasoning
│  ├─ 📄 core-concepts.md
│  │   ℹ Foundational principles underlying the project
│  │   1. Key Definitions
│  │   │  ℹ Explains domain-specific terms for clarity
│  │   2. Core Framework
│  │      ℹ Outlines the main conceptual framework the project follows
│  ├─ 📄 methodology.md
│  │   ℹ Describes the approach and methodologies used
│  │   1. Process Overview
│  │   │  ℹ Explains the high-level steps for feature development
│  │   2. Best Practices
│  │      ℹ Guidelines that ensure consistent and high-quality output

├─ 📂 src
│  ├─ 📄 main.ts
│  │   ℹ Entry point CLI: orchestrates commands, handles config
│  │   1. runCLI()
│  │      ℹ Invokes command parsing and triggers the main workflow
│  ├─ 📄 utils.ts
│  │   ℹ Shared formatting and error handling utilities
│  │   1. formatOutput()
│  │   │  ℹ Formats CLI output for readability
│  │   2. handleError()
│  │      ℹ Provides consistent error handling across commands
│  └─ (No mention of internal_helper.ts as it’s purely internal)

├─ 📂 tests
│  ├─ 📄 main_test.ts
│  │   ℹ Tests related to main.ts functionality
│  │   1. testRunCLI()
│  │      ℹ Ensures runCLI() properly parses arguments and executes main workflow in main.ts
│  ├─ 📄 utils_test.ts
│  │   ℹ Tests for utils.ts functions
│  │   1. testFormatOutput()
│  │   │  ℹ Validates that formatOutput() produces the expected formatted strings
│  │   2. testHandleError()
│  │      ℹ Verifies that handleError() outputs errors consistently and clearly

├─ 📄 README.md
│   ℹ High-level overview, architecture rationale, and getting started guide
│   1. Introduction
│   │ ℹ Summarizes the project’s purpose and scope
│   2. Installation
│   │ ℹ Provides basic setup steps
│   3. Usage
│     ℹ Explains how to run and interact with the project

├─ 📂 vendor-docs
│  │ ℹ Documentation here relates specifically to dependencies (both code packages and dependent projects)
│  └─ 📄 commander/README.md
│     ℹ Documentation for the `commander` library used by the CLI to parse command-line arguments

└─ 📂 dependencies
   ├─ 📦 @babel/parser
   │   ℹ Used to parse and evaluate embedded JSON data structures in script tags
   ├─ 📦 @my-org/some-package
   │   ℹ A scoped npm package providing specialized parsing utilities
   ├─ 🧩 subproject1
   │   ℹ A dependent project integrated as part of the tool’s ecosystem
   └─ 📦 commander
       ℹ Command-line argument parsing library for the CLI interface
```
