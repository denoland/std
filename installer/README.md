# deno_install

- This command installs executable deno script.

## Features

- Install executable script into ~/.deno/bin

## Usage

```sh
$ deno_install https://deno.land/std/http/file_server.ts
> file_server requests network access. Grant permanently? [yN] # Grant the permissions to use command.
> y
> Successfully installed file_server.
$ file_server # now you can use installed command!
```

## Requirements

- wget #TODO: Remove

## Installing

### 1. Install deno_install

deno_install can be installed by using itself.

```sh
deno -A https://deno.land/std/install/deno_install.ts https://deno.land/std/install/deno_install.ts
```

### 2. Add `~/.deno/bin` to PATH

```
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.bashrc # change this to your shell
```

## Create Executable Script

- Add shebang to top of your deno script.
  - This defines what permissions are needed.

```sh
#!/usr/bin/env deno --allow-read --allow-write --allow-env --allow-run
```

- Host script on the web.
- Install script using deno_install.
