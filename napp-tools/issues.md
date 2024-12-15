how should secrets be handled?

config overrides model - needs to be reasoned into the module

```md
    Layered Configuration Files and Merging
    How It Works:

    The NAPP provides a base configuration (napp.json).
    The NAPP may also provide optional environment-specific configuration files (napp.dev.json, napp.prod.json, etc.).
    The consumer (or the runtime system) picks which file to load and merges them accordingly.
    Consumer Overrides:

    The consumer selects which environment file to include by specifying a parameter (e.g., --env=prod).
    Additional final overrides can come from a separate file (like napp.consumer.json) that merges last.
```

or you can set these config options in the napp config file, and ignore it in
children ? In the overrides, ANY key is able to be overridden. It can be removed
by setting it to null. Overrides MUST be inside the json file, since they might
be part of the default configuration. In this case, the highest napp wins.

secrets - make this part of the api, and also override the process.env setting
to enable legacy code to work. recommedned way is using the api. throw if not
present since this is a requirement of the call being made. Might be sent as a
3rd channel in all the actions - so the json action, the filesystem, and the
secrets.
