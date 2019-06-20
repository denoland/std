# deno_installer

Install remote or local script as executables.

## Installation

`installer` can be install using itself:

```sh
deno -A https://deno.land/std/installer/mod.ts install deno_installer https://deno.land/std/installer/mod.ts -A
```

Installer uses `~/.deno/bin` to store installed scripts so make sure it's in `$PATH`

```
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.bashrc # change this to your shell
```

## Usage

Install script

```sh
# remote script
$ deno_installer install file_server https://deno.land/std/http/file_server.ts --allow-net --allow-read
> [1/1] Compiling https://deno.land/std/http/file_server.ts
>
> ✅ Successfully installed file_server.

# local script
$ deno_installer install file_server ./deno_std/http/file_server.ts --allow-net --allow-read
> [1/1] Compiling file:///dev/deno_std/http/file_server.ts
>
> ✅ Successfully installed file_server.
```

Use installed script:

```sh
$ file_server
HTTP server listening on http://0.0.0.0:4500/
```

Update installed script

```sh
$ deno_installer install file_server https://deno.land/std/http/file_server.ts --allow-net --allow-read
> ⚠️  file_server is already installed, do you want to overwrite it? [yN]
> y
>
> [1/1] Compiling file:///dev/deno_std/http/file_server.ts
>
> ✅ Successfully installed file_server.
```

Uninstall script

```sh
$ deno_installer uninstall file_server
> ℹ️  Uninstalled file_server
```

Show help

```sh
$ deno_installer --help
> deno installer
  Install remote or local script as executables.

USAGE:
  deno https://deno.land/std/installer/mod.ts install EXE_NAME SCRIPT_URL [FLAGS...]
  deno https://deno.land/std/installer/mod.ts uninstall EXE_NAME

ARGS:
  EXE_NAME  Name for executable
  SCRIPT_URL  Local or remote URL of script to install
  [FLAGS...]  List of flags for script, both Deno permission and script specific
              flag can be used.
```
