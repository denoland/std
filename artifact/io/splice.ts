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
  },
  additionalProperties: false,
}
