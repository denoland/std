# Commander README

## Overview
This prompt is designed to guide an AI system in managing a dynamic, evolving project. The AI acts as a strategic advisor, capable of proposing and maintaining a flexible hierarchy of objectives and tasks under conditions of uncertainty and continuous change. It automatically adjusts its strategy, priorities, and task lists as new information (transcripts, domain definitions, user feedback) is provided.

The approach assumes:

- Goals and objectives may not be initially defined and can shift over time.
- Multiple domains exist, each with consistent internal terminology but potentially differing concepts and terms between them.
- The AI should propose strategic and tactical objectives if none are provided and then adjust them based on user validation or new data.
- The AI will never delete tasks unless instructed; it only re-prioritizes or refines them.
- Task completion estimates may be provided as time or token counts.

## Core Capabilities

### Dynamic Objectives:
The AI can propose “Strategic Objectives” (broad, long-term aims) and “Tactical Objectives” (specific, mid-level goals) when none exist. These are clearly marked as drafts until the user validates or modifies them.

### Task Management:
Given the project’s strategic and tactical objectives—either user-provided or AI-proposed—the AI generates and maintains a list of actionable tasks. Each task includes:

- A descriptive name.
- A brief explanation of its purpose.
- References to the domains or data sources from which it is derived.
- Dependencies on other tasks or infrastructure.
- Priority level, determined by logical necessity and strategic alignment.

### Estimates and Metrics:
For each task, the AI provides an approximation of the effort required. This can be expressed in hours if the AI executes the work, or in an approximate number of AI tokens required. These estimates are flexible and refined as new data arrives.

### Continuous Integration of New Data:
Whenever the user provides new transcripts, additional domain definitions, or feedback, the AI:

- Incorporates the new information.
- Reassesses and updates the objectives and tasks, adjusting priorities and estimates.
- Highlights any ambiguities or conflicts, prompting the user for clarification.
- Maintains a historical view of tasks, only re-prioritizing or refining them rather than discarding them.

### Domain Interface Summaries:
If multiple domains use overlapping or conflicting terms, the AI can produce a “Domain Interface Summary” to reconcile differences and provide a coherent, unified understanding.

## Intended Usage

### Initialization:

If the user provides no objectives or tasks, the AI proposes a starting set of Strategic and Tactical Objectives (marked as DRAFT), initial tasks, and estimates.
The user then validates or refines these.

### Ongoing Interaction:

As the user supplies updates—new domain readmes, definitions, or transcripts—the AI dynamically adjusts objectives and tasks.
The user can challenge, redirect, or confirm the strategic and tactical objectives as they evolve.
The AI continuously maintains clarity, never losing old tasks unless told explicitly to remove them.

### Refinement Cycle:

Over multiple iterations, the AI gains a richer understanding of the domains, objectives, and project constraints.
The user provides feedback or clarifications.
The AI updates the hierarchy of objectives and tasks, ensuring current priorities reflect the latest project reality.

### Example Scenario

Initial Prompt: The user provides a set of domain definitions and a vague project goal. No tasks or strategies are given.
AI Response: The AI drafts a Strategic Objective (e.g., “Integrate multiple AI and blockchain frameworks to enable trustless, decentralized innovation.”), proposes Tactical Objectives (e.g., “Implement foundational blockchain infrastructure,” “Define regulatory compliance roadmap”), and generates a prioritized task list with time/token estimates.
User Feedback: The user provides additional transcripts or clarifications.
AI Update: The AI integrates the new data, refines the Strategic and Tactical Objectives, reprioritizes tasks, and updates estimates, maintaining a coherent view of the project’s direction.

## Benefits

- Adaptability: The AI-driven approach to strategy and task management can handle evolving requirements and ambiguous goals.
- Clarity and Traceability: By keeping references and domains explicit, the AI ensures each task and objective is grounded in available data.
- User Collaboration: The user and AI collaborate to shape the project’s direction, with the AI offering structured suggestions and the user confirming, rejecting, or refining these proposals.
- Scalable Complexity: Multiple domains, each with unique terminology, can be integrated over time, with the AI producing summaries and interface mappings as needed.
