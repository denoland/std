# Definition

**Definition**: A formal description of a core concept within the platform ecosystem that establishes precise meaning through a concise statement and references to other definitions, forming part of a directed acyclic graph (DAG) of platform knowledge.

**Description**: Definitions form an interconnected knowledge DAG where each definition:

- Contains a precise statement of meaning (Definition section)
- Provides expanded context and examples (Description section)
- References other definitions using markdown links to avoid repetition
- Can be referenced by multiple other definitions (multiple "parents")
- Avoids circular references while maintaining multiple connection paths

Like a filesystem with hard links (but not symlinks), definitions can be referenced by multiple other definitions while maintaining an acyclic structure. This enables:

- Clear understanding of core platform concepts
- Consistent terminology across documentation
- Complex composition of ideas through multiple reference paths
- Reduced redundancy through cross-referencing

Definitions are distinct from implementation details or user stories - they establish _what_ something is, not _how_ it is used. More complex relationships between defined components (like interaction patterns or workflows) are documented separately.
