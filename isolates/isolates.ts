interface SearchArgs {
  query: string
}
interface SearchResult {
  isolatePath: string
  functionName: string
  schema: string
}
interface ReadArgs {
  isolate: string
  commands?: string[]
  /** Read the functions object, and convert into a string */
  functions?: boolean
}
export type Api = {
  ls: () => Promise<string[]>
  /**
   * Response will be a list of the api functions that matched the query,
   * along with the isolate name.  The interpreting bot should then relate
   * what the function does to the caller with relevance to the search query
   * @param params
   * @returns
   */
  search: (params: SearchArgs) => Promise<SearchResult[]>
  read: (params: ReadArgs) => Promise<string[]>
}
