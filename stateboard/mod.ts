import { z } from 'zod'

export type STATEBOARD_WIDGETS = z.infer<typeof STATEBOARD_WIDGETS>
export const STATEBOARD_WIDGETS = z.enum([
  'TPS_REPORT',
  'FILE_EXPLORER',
  'MARKDOWN_EDITOR',
  'BRANCH_EXPLORER',
  'COMMIT_GRAPH',
  'COMMIT_INFO',
  'THREADS',
  'REPOS',
])
