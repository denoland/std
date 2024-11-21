# Artifact

**Definition**: The foundational layer of the
[Dreamcatcher Platform](dreamcatcher-platform.md) that executes
[NApps](napp.md), providing repeatable computation and state management through
a git-compatible blockchain architecture. NApps are the native package format of
Artifact.

**Description**: Artifact serves as the underlying substrate for all
[Platform Instances](platform-instance.md) within the Dreamcatcher ecosystem,
enabling:

- Deterministic execution of [NApps](napp.md) through:

  - Git-compatible blockchain storage where each block is a commit
  - Branch-based process isolation with consistent filesystem states
  - Massive parallel computation via a high number of concurrent git branches
  - Repeatable computation for both classical and AI operations
  - Standardized seed parameters for probabilistic AI computations

- Cross-instance coordination through:

  - Branch merging capabilities for parallel execution paths
  - Repeatable state verification between instances
  - Blockchain-based [Consensus Mode](consensus-mode.md) implementation
  - Network-wide state synchronization
  - Edge computing with offline operation and mesh resynchronization

- Platform capabilities including:

  - Local and remote AI model execution
  - API-based LLM integration with repeatability guarantees
  - Distributed computation verification
  - Git-compatible version control and state management
  - Autonomous operation during network disconnection
  - Seamless mesh network reintegration after offline periods

Artifact enables the decentralized nature of the Dreamcatcher Platform while
ensuring computational consistency, massive scalability, and verifiability
across all instances, forming the technical foundation for the Dreamcatcher
ecosystem.
