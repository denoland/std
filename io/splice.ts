export default class Splice {
}

export const schema = {
  type: 'object',
  required: [],
  properties: {
    parent: { type: 'string', description: 'parent commit' },
    parents: {
      type: 'array',
      items: { type: 'string' },
      description: 'any other parents that might be present',
    },
    // a tree of jsonpatch objects
    tree: { type: 'string', description: 'tree object' },
    path: {
      type: 'array',
      description:
        'path to the file being changed.  If this is blank, it implies the splice is for a commit ?',
    },
    status: {
      description: 'The current patch status',
      enum: ['pooled', 'committed'],
    },
    prior: {
      type: 'string',
      description:
        'prior commit that the current patch is based on, so that on resumption of a subscription you can recover',
    },
  },
  additionalProperties: false,
}

// these are always relative to some commit
// partials are beyond the head commit

// children are given by the io file
// https://the.site/account/repo/path/to/file?branch=name&start=commit&end=commit&merge&watch

// merge means that a single splice should be returned

// need to display children
