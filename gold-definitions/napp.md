# NApp (Natural language Application)

**Definition**: A modular, language-agnostic package that provides JSON-based
function interfaces for both deterministic (classical code) and probabilistic
(AI) computing, designed to be discovered, shared, and executed within the
Dreamcatcher ecosystem.

**Description**: NApps are the fundamental functional units on the platform,
developed and utilized by [Actors](actor.md). They:

- Present unified JSON interfaces for cross-language function calls
- Enable seamless integration between AI systems and traditional code
- Support streaming data and event-driven architectures
- Include explicit permission definitions and security constraints
- Maintain provenance through git-based versioning
- Can be combined or orchestrated to create complex services via
  [JITAs](jita.md)
- Operate with built-in attribution and cost tracking mechanisms
- Include comprehensive documentation and testing
- Support reproducible builds and state management
- Can run across different [Platform Instances](platform-instance.md) through
  shared [Protocols](protocol.md)

NApps are designed to be "AI-native" and "chattable," allowing AI systems to
effectively discover and invoke their functionality while maintaining
interoperability across different platforms and hosts, fostering collaboration
and innovation.
