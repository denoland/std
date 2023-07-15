export interface MatcherContext {
  value: unknown;
  isNot: boolean;
  customMessage: string | undefined;
}

export type Matcher = (context: MatcherContext, ...args: unknown[]) => MatchResult

export type Matchers = {
  [key: string]: Matcher
}
export type MatchResult = void | Promise<void>;