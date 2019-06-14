# deno_install

Installs remote or local script as executable.

````
## Installation

`installer` can be install using iteself:

```sh
deno -A https://deno.land/std/install/deno_install.ts https://deno.land/std/install/deno_install.ts -A
````

Installer uses `~/.deno/bin` to store installed scripts so make sure it's in `$PATH`

```
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.bashrc # change this to your shell
```

## Usage

Install script

```sh
$ deno_install https://deno.land/std/http/file_server.ts --allow-net --allow-read
> Downloading: https://deno.land/std/http/file_server.ts
>
> ✅ Successfully installed file_server.

# local script
$ deno_install ./deno_std/http/file_server.ts --allow-net --allow-read
> Looking for: /dev/deno_std/http/file_server.ts
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
$ deno_install https://deno.land/std/http/file_server.ts --allow-net --allow-read
> ⚠️  file_server is already installed, do you want to overwrite it? [yN]
> y
>
> Downloading: https://deno.land/std/http/file_server.ts
>
> ✅ Successfully installed file_server.
```

Uninstall script

```sh
$ deno_install uninstall file_server
> ℹ️  Uninstalled file_server
```

Display help

```sh
$ deno_install --help
> USAGE:
deno https://deno.land/std/installer/mod.ts SCRIPT [FLAGS...]

ARGS:
  SCRIPT      URL of script to install
  [FLAGS...]  List of flags for script, both Deno permission and script specific flag can be used.

```
