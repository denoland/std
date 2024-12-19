# User Story

**Definition**: A narrative description of how [Actors](actor.md) interact with platform components and other Actors to achieve specific goals, building upon the foundational concepts established in definitions.

**Description**: User stories demonstrate practical applications and interactions by:

- Describing specific scenarios of platform usage
- Showing how multiple defined components work together
- Illustrating complex workflows and interaction patterns
- Providing concrete examples of abstract concepts in action

Unlike [Definitions](definition.md) which form a knowledge DAG of _what_ things are, user stories form a separate layer that describes _how_ things work together. They:

- Build upon established definitions without modifying them
- Can reference multiple definitions in a single narrative flow
- May include implementation details and practical examples
- Often follow the format "As [Actor type], I want to [action] so that [benefit]"

For example

- a user story might describe how a [Trader](trader.md) interacts with [Legal Gateways](legal-gateway.md) and [Payment Paths](payment-path.md) to complete a specific type of [Value Exchange](value-exchange.md), while the individual definitions only establish what each of these components is.

- an additional example, a user story might describe an [Actor Demander](actor-demander.md) creating a [Direct Stuck](direct-stuck.md) to initiate the [Stuck Loop Process](stuck-loop-process.md).

