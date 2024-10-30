export * from './files.ts'

// this is an attempt to give types to the napp, but this should be auto
// generated from the napp.jsonc file at publish time

export type NappTypes = {
  // import show from the stateboard napp and export this
  show: (params: { path: string }) => Promise<void>
  write: (
    params: { path: string; content: string },
  ) => { charactersWritten: number }
}
