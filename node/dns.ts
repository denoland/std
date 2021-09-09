export interface LookupOptions {
  family?: number | undefined;
  hints?: number | undefined;
  all?: boolean | undefined;
  verbatim?: boolean | undefined;
}

export interface LookupOneOptions extends LookupOptions {
  all?: false | undefined;
}
