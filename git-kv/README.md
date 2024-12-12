# Overview

This module provides a `.git` directory abstraction on top of a key-value store,
allowing `isomorphic-git` to operate in non-traditional environments without
depending on local disk I/O. Instead of reading and writing `.git` data from the
local filesystem, all interactions are routed through a key-value database,
making it possible to run Git operations in environments like serverless
platforms or multi-tenant, globally distributed systems.

## Key Characteristics

- **Key-Value Storage for Git Data:**\
  All repository data that would normally reside in a local `.git` directory is
  stored in a key-value database. This includes references, configuration, and
  Git object data. Deno’s KV store provides the underlying storage layer.

- **No Single HEAD Pointer:**\
  There is no global, shared HEAD. Each process or execution context operates on
  its own branch reference. HEAD points to `refs/heads/<branch>/...` derived
  from the PID (Process ID) context. This design enables concurrent operations
  on different branches without conflicts.

- **Atomic Reference Updates:**\
  Updates to references (e.g., when committing to a branch) are performed
  atomically. Either all changes succeed together, or none are applied. This
  ensures that distributed or delayed writes never leave the repository in an
  inconsistent state.

- **No Index File:**\
  The traditional Git index file is not used. The system reads objects directly
  from the key-value store. This simplifies the implementation and ensures
  scalability for large repositories and distributed environments.

- **No Direct Access to `.git` Directory by Consumers:**\
  The `.git` directory is virtualized and never directly exposed. Consumers only
  interact with regular repository paths. When a file is requested, the system
  retrieves it from Git objects stored in the database. Paths under `.git`
  cannot be read or written by external consumers; they are reserved for
  `isomorphic-git` operations through the key-value layer.

- **Deterministic Path Rules:**\
  Only certain Git-internal paths (`config`, `objects`, `refs`) are stored in
  the key-value database. Attempts to read or write other `.git` paths are
  rejected. HEAD updates are ignored if attempted directly, and the Git index
  file is not supported.

- **Support for Clone, Fetch, and Merge Operations:**\
  Git operations such as `clone`, `fetch`, and `merge` are implemented via
  `isomorphic-git`. These operations operate through this abstraction layer,
  with all necessary data (like references and objects) coming from and going
  into the key-value store. Merges are performed with a custom merge driver that
  uses `diff3` logic to reconcile conflicts.

- **Caching:**\
  A caching layer prevents unnecessary round trips to the key-value store.
  Recently accessed data, such as Git objects, are cached in memory and may
  optionally use global caching mechanisms (like `globalThis.caches`) when
  available. No additional cache extensions or invalidation strategies are
  required beyond what is implemented.

## Intended Use Case

This module is designed for environments where a traditional filesystem is not
available or desirable. Serverless functions, containerized builds, and
distributed compute nodes can all benefit from a `.git` abstraction that relies
solely on a key-value store for state. Without a single HEAD pointer and by
removing reliance on local index files, multiple concurrent execution contexts
can work on separate branches, ensuring that operations scale without
introducing file-based race conditions or complex locking schemes.

Operations like `init`, `clone`, `commit`, `merge`, and `fetch` translate into
atomic database updates, making repository state consistent and reproducible
across arbitrary numbers of execution contexts or physical locations.
