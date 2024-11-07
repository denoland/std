# Snapshots

Snapshots are a posix filesystem that works with content addressable files and
is snapshot aware.

A snapshot represents a tree of posix file paths that represent hashed content.

Snapshots have linked lineage, and all except the first snapshot in a chain have
at least one parent, and can have several parents if the snapshot represents a
merge of multiple snapshots.

The intended purpose of this implementation is to be backed by a git repository,
but this abstraction need not use git, and could use any other kind of
blockchain structure underneath, like IPFS or Pijul, for example.

The purpose of representing a posix filesystem is that all code understands
files, and so this model is time tested, familiar, and broadly compatible with
multiple software languages.

Snapshots have 3 key concepts.

1. blobs, which are analogous to files, that are represented by a hash
1. trees, which are analogous to directories, are a data structure containing an
   array of blobs and trees
1. snapshots, which are analogous to commits, represent a specific tree with
   pointers to the previous snapshots, representing a linear progression of
   changes
