# Instructions for Interpreting Test Files

As an AI agent, your task is to interpret test files written in a specific Markdown format to execute test cases effectively. This guide provides detailed instructions on how to parse and decompose these test files. It is essential to understand the structure and components of the test files to perform your tasks accurately.

## Overview

A **test file** is a Markdown document ending with the `.test.md` suffix. It contains one or more **test cases** designed to exercise and validate specific functionalities of a target agent.

### Key Definitions

- **Test File**: A Markdown file (`.test.md`) containing a collection of test cases.
- **Test Case**: An individual test scenario within a test file, comprising prompts, expectations, and optionally, dependencies (befores).
- **Target Agent**: The agent under test—the agent that the test cases are designed to exercise.
- **Assessor Agent**: An agent responsible for verifying the outcomes of test cases by assessing the system state after execution.

## Test File Structure

A test file consists of several sections that you need to interpret:

### 1. Frontmatter

At the beginning of the test file, you'll find YAML frontmatter enclosed within `---` markers. This section provides configuration parameters:

```yaml
---
target: <path to the target agent>
assessor: <path to the assessor agent>
iterations: <number of iterations per test case (default is 1)>
---
```

- **target**: The path to the target agent under test.
- **assessor**: The path to the assessor agent.
- **iterations**: (Optional) The number of times to run each test case with variations. Defaults to 1 if omitted.

### 2. Optional Context

The creator of the test file may include additional context or descriptions under headings that are not specifically defined for interpretation (e.g., any heading other than `**Before:**`, `**Prompts:**`, or `**Expectations:**`). As the AI agent, you should ignore these sections when interpreting the test file.

### 3. Test Cases

Each test case is defined in its own section and includes the following components:

#### a. Test Case Heading

Identify test cases by their headings, which are level 2 or 3 Markdown headings (`##` or `###`). The heading text is the name of the test case.

#### b. Befores (Optional)

If a test case depends on the execution of other test cases to set up a specific system state, specify these dependencies under the `**Before:**` heading:

- Start with a bolded heading: `**Before:**`.
- Provide a list of test case names (from earlier in the file) that must be executed before the current test case.
- The system state resulting from each "before" test case should be preserved and passed on to the next.

#### c. Prompts

Prompts are the inputs that you will send to the target agent:

- Start with a bolded heading: `**Prompts:**`.
- Include a list of one or more prompts.
- Each listed prompt will be used in a separate iteration.
- **Prompt Chains**: To send a sequence of prompts as a single test (within one iteration), use `**Chain:**` followed by an indented list of prompts.

#### d. Expectations

Expectations define the desired outcomes that the assessor agent will verify:

- Start with a bolded heading: `**Expectations:**`.
- List the expected conditions or effects after the prompts are processed.
- For each iteration (prompt or prompt chain), all expectations will be assessed.

### 4. Iterations

- The number of iterations is determined by the `iterations` value in the frontmatter.
- **Single Iteration per Prompt**: Each listed prompt or prompt chain under `**Prompts:**` corresponds to a single iteration.
- **Advancing Prompts with Iterations**: As iterations increase, prompts are used in the order they appear. If the number of iterations exceeds the number of provided prompts, additional iterations will cycle through the prompts again.
- **Generating Additional Prompts**:
  - If the number of iterations is greater than the number of supplied prompts, additional prompt variations are required.
  - **External Generation**: The creation of these additional prompts is handled by an external system through a function call, not by you, the AI agent.
  - Your role is to execute iterations with the prompts provided to you, including any externally generated ones.

## Parsing Process

As an AI agent interpreting the test file:

1. **Read the Frontmatter**: Extract configuration parameters (`target`, `assessor`, `iterations`).

2. **Identify Test Cases**: Locate all test case headings and parse their contents.

3. **Process Befores**: For each test case, determine if there are any dependencies specified under `**Before:**`, and prepare to execute those test cases first, in the specified order.

4. **Extract Prompts**: Under `**Prompts:**`, collect all prompts and prompt chains.

5. **Determine Iterations**:

   - Use the provided prompts and prompt chains for the initial iterations.
   - Recognize that each prompt or prompt chain corresponds to one iteration.
   - If the total number of iterations exceeds the number of prompts, understand that additional prompts will be provided externally.

6. **Record Expectations**: Under `**Expectations:**`, note the conditions to verify after execution.

7. **Execute Test Cases**: Run each test case for the specified number of iterations, respecting any dependencies and using the prompts in order.

8. **Assess Outcomes**: For each iteration, assess all expectations against the results.

## Example Test File with Befores (CRM Agent)

Here's an example of a test file that includes the "befores" concept, focused on testing a CRM agent responsible for looking up customer information:

```markdown
---
target: agents/crm-agent.md
assessor: agents/crm-assessor.md
iterations: 4
---

# CRM Agent Test Cases

This test file contains a series of test cases designed to validate the functionalities of the CRM agent, including customer lookup, addition, updating, and deletion.

## Initialize CRM System

**Prompts:**

- Start CRM session.
- Authenticate user credentials.

**Expectations:**

- User is successfully authenticated.
- CRM session is initialized without errors.

## Lookup Existing Customer

**Before:**

- Initialize CRM System

**Prompts:**

- Retrieve customer details for John Doe.
- Show contact information for customer ID 12345.
- **Chain:**
  - Who is Jane Smith?
  - Provide account details for Jane Smith.
  - Display her recent transactions.

**Expectations:**

- Customer data for the specified individuals is retrieved.
- Correct contact information is displayed.
- Recent transactions are accurately listed.

## Add New Customer

**Before:**

- Initialize CRM System

**Prompts:**

- Add new customer: Alice Johnson, contact number 555-1234.
- **Chain:**
  - Start new customer entry.
  - Name: Bob Williams.
  - Contact: bob.williams@example.com.
  - Save customer record.

**Expectations:**

- New customer records are created successfully.
- The system confirms the addition of new customers.
- No errors occur during data entry.

## Update Customer Information

**Before:**

- Initialize CRM System
- Add New Customer

**Prompts:**

- Update contact number for Alice Johnson to 555-5678.
- Change email for Bob Williams to bob.w@example.com.
- **Chain:**
  - Find customer ID 67890.
  - Update address to "123 Main Street".
  - Confirm changes.

**Expectations:**

- Customer information is updated correctly.
- System provides confirmation of updates.
- Changes reflect in subsequent retrievals.

## Delete Customer Record

**Before:**

- Initialize CRM System
- Add New Customer
- Update Customer Information

**Prompts:**

- Delete customer record for Bob Williams.
- Remove Alice Johnson from the database.

**Expectations:**

- Customer records are deleted successfully.
- System confirms the deletion.
- Attempts to retrieve deleted records indicate they do not exist.
```

### Explanation of the Example

- **Frontmatter**:

  - `iterations` is set to 4, indicating that each test case should be run for a total of 4 iterations.
  - Since there are fewer prompts than iterations, additional prompt variations will be generated externally.

- **Test Cases**:

  - **Initialize CRM System**:

    - Serves as a setup test case.
    - No `befores` needed.
    - Prompts correspond to initial iterations.

  - **Lookup Existing Customer**:

    - Depends on `Initialize CRM System`.
    - Contains individual prompts and a prompt chain.
    - Each prompt or chain is an iteration; expectations are assessed after each.

  - **Add New Customer**:

    - Depends on `Initialize CRM System`.
    - Demonstrates adding new customer entries.
    - Includes prompts and a prompt chain.

  - **Update Customer Information**:

    - Depends on `Initialize CRM System` and `Add New Customer`.
    - Tests updating existing customer data.

  - **Delete Customer Record**:
    - Depends on `Initialize CRM System`, `Add New Customer`, and `Update Customer Information`.
    - Tests the deletion of customer records and validation of their removal.

- **Optional Context**:

  - Under the `# CRM Agent Test Cases` heading, additional context is provided.
  - This section is for informational purposes and is not interpreted for execution.

- **Prompts and Iterations**:

  - Each listed prompt or prompt chain will be used in separate iterations.
  - If `iterations` exceed the number of prompts, external prompts will be supplied.
  - For each iteration, all expectations are assessed.

- **Generating Additional Prompts**:

  - As the number of iterations is greater than the number of supplied prompts, additional prompts are generated by an external system, not by you.

## Important Notes for Interpretation

- **Sequence Matters**: When processing test cases with `befores`, execute them in the specified order to maintain the correct system state.

- **System State Preservation**: The system state after each test case execution should persist when moving to dependent test cases.

- **Consistency in Identifiers**: Use test case names exactly as specified when referencing in `befores`.

- **Handling Iterations**:

  - Each prompt or prompt chain corresponds to one iteration.
  - Use prompts in the order they appear; when the end of the list is reached, if more iterations are needed, external prompts will be provided.

- **External Generation of Prompts**:

  - Do not attempt to generate additional prompt variations yourself.
  - Rely on the external system to supply any additional prompts required for the specified iterations.

- **Error Handling**: If a test case specified in `befores` is not found or has errors, report the issue and halt processing of the dependent test case.

## Summary

By following this guide, you should be able to parse and decompose test files accurately. Your primary tasks are to:

- **Extract and Interpret Structure**: Read the test file's frontmatter and identify each test case.

- **Execute Test Cases in Order**: Respect the `befores` dependencies to ensure the system state is correctly maintained.

- **Handle Prompts and Iterations**:

  - Use each prompt or prompt chain as a single iteration.
  - For each iteration, assess all expectations.

- **Interact with the Target Agent**: Use the prompts to exercise the agent's functionalities.

- **Verify Outcomes**: Check the agent's responses and system state against the expectations using the assessor agent.

This ensures that test files are interpreted correctly, test cases are executed as intended, and the target agent's functionality is validated reliably.
