# napp-tools

The rules of Napps:

1. the default native code export must contain exactly what is specified in the
   napp config file.
2. There must be an export named "napp.json" which contains the napp config

Requirements of `tools` key:

1. Be able to merge multiple napps tools together, into this napps tools
2. Cherry pick from multiple imported napps, where we want a combination of some
   of the tools of the other napps
3. Include our own tools inside the napp tools as well as imported ones
4. Be simple when we only have our own tools or the tools of another napp
5. Be able to call another napps `agent` function to treat it like a standalone
   agent having a plain text conversation with it

Requirements of the `agent` key:

1. Be omitted if this is not meant to be chatted with
2. Be called by other napps in pure agent mode, where this is a standalone
   agent, talking back to the caller

Requirements of the `stucks` key:

1. Define configuration for stuck detection and handling
2. Include title, description, snapshot information, and crypto identifiers
3. Support branch specification and expected conditions

Requirements of the `evals` key:

1. Specify test runner configuration
2. Support listing of test files for napp verification

Requirements of the `dependencies` key:

1. List all required napps with version information
2. Support optional name overrides for dependencies

Requirements of the `graphics` key:

1. Support exported widgets for stateboard display
2. Allow framework specification (currently React)
3. Enable component pass-through and renaming from other napps
4. Support parameter configuration for components

Requirements of the `effects` key:

1. Provide mount and unmount hooks for side effects
2. Support tooling for setup and cleanup operations

Gateway requirements:

1. Have different configuration for mock, test, and prod environments
2. have failover and retry config information
