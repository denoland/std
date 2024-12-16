**Motivation:**\
A well-structured overview file named `PROJECT_MAP.md` provides a top-level,
maintainable map of your project, whether it's a codebase or knowledge base. It
highlights the purpose of key components, how they connect, and why they exist,
without getting lost in the details. This high-level perspective makes
onboarding easier, streamlines maintenance, and ensures everyone stays aligned
on the overall structure.

**How to Create One:**

1. **Start with the root:**
   - Begin at the project's top-level directory.
   - List the main directories and key files that define the core structure.

2. **Use a clear notation:**
   - Represent directories with `📂` and files with `📄`.
   - Add a brief rationale line (`ℹ`) to explain the purpose of that file or
     directory.
   - For code files: only list exported functions or top-level sections within
     files. Leave out internal-only functions or overly detailed sections.
   - For knowledge files: list main topics or sections and skip the lower level
     details.

3. **Maintain a high-level focus:**
   - Do **not** include the `PROJECT_MAP.md` itself in the diagram. This file is
     a meta-document, not part of the project structure. Its purpose is to
     describe the layout, not to be part of it.
   - Avoid enumerating every single file. Small files that serve only a single
     purpose within a module or minor supporting documents that are never
     referenced elsewhere can be omitted. Their inclusion adds noise without
     improving understanding.

4. **Keep it concise and readable:**
   - Focus on key structural elements and main concepts.
   - Omitting minutiae preserves clarity. The goal is to provide a meaningful
     overview, not replicate the entire directory tree in detail.

5. **Update regularly:**
   - Refresh the document as your structure changes.

**Example:**

```text
PROJECT_MAP.md

PROJECT_ROOT/
├─ 📂 reasoning
│  ├─ 📄 core-concepts.md
│  │   ℹ Foundational ideas and principles
│  │   • Key Definitions
│  │   • Core Framework
│  ├─ 📄 methodology.md
│  │   ℹ Approach and methods used
│  │   • Process Overview
│  │   • Best Practices
├─ 📂 src
│  ├─ 📄 main.ts
│  │   ℹ Entry point CLI: orchestrates commands, handles config
│  │   • runCLI() // exported
│  ├─ 📄 utils.ts
│  │   ℹ Shared formatting and error handling utilities
│  │   • formatOutput() // exported
│  │   • handleError() // exported
│  └─ (No mention of small internal_helper.ts because it's only used privately by utils.ts)
└─ 📄 README.md
    ℹ High-level overview, architecture rationale, and getting started guide
    • Introduction
    • Installation
    • Usage
```

This approach prioritizes clarity and maintainability. It ensures a focused,
top-level understanding of the project without drowning in implementation
details or secondary content.
