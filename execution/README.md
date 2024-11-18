# Execution

## Overview

The execution system provides a repeatable way to handle asynchronous
operations, file system interactions, and remote procedure calls in a
distributed environment. It ensures consistency through a trail-based execution
model with filesystem snapshots.

## Core Principles

1. **Action-Based Execution Model**
   - Input: JSON action + filesystem snapshot
   - Output: JSON reply + JSON actions + filesystem changes
   - File IO contents never appear in actions; filesystem is referenced instead

2. **Trail System**
   - Tracks execution paths with sequence numbers
   - Manages payloads separately from actions
   - Supports pause/resume of executions
   - Handles timeouts and activation states
   - Manages request sequencing and replies
   - Processes pending operations
   - Maintains execution order through sequence numbers

3. **Compartment Isolation**
   - Provides isolated execution environments
   - Manages mounting/unmounting of napps
   - Handles API access and state management
   - Supports effect recovery and context management

## Key Components

### Executor

Handles the main execution flow:

- Function caching
- Trail management
- File system state tracking
- Promise-based JavaScript interface

### Trail

Provides execution path tracking:

- Action sequencing
- Payload management
- State transitions
- Request queuing and reply handling
- Pending operation management
- JSON-based execution state storage
- Historical reply storage for replay capability

### Compartment

Provides isolation:

- Napp loading
- API mounting
- Process management
- Effect handling

## Error Handling

1. **Execution Errors**
   - Function not found
   - Invalid parameters
   - Timeout errors

## Best Practices

1. **Action Design**
   - Keep actions pure and serializable
   - Separate file contents from actions
   - Use proper sequence numbers
   - Handle timeouts appropriately

2. **State Management**
   - Track filesystem changes carefully
   - Manage pending operations properly
   - Handle effect recovery
   - Maintain proper execution order

3. **Error Handling**
   - Implement proper error recovery
   - Handle timeout cases
   - Track execution failures

## Implementation Notes

1. **File Operations**
   - File contents are handled through payloads
   - Files are referenced by path in actions
   - Changes are tracked through snapshots

2. **Execution Flow**
   - Actions are sequenced
   - Replies are matched to requests
   - Pending operations are tracked
   - State is maintained consistently

3. **Performance Considerations**
   - Function caching is available
   - Execution can be paused/resumed
   - State changes are tracked efficiently
   - File operations are optimized
