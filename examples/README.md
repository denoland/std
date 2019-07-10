# Deno Example Programs

These files are accessible for import via "https://deno.land/std/examples/".

Try it:

```
> deno https://deno.land/std/examples/cat.ts README.md
```

## Install as executable

```
deno install gist https://deno.land/examples/gist.ts --allow-net --allow-env
export GIST_TOKEN=ABC # Generate at https://github.com/settings/tokens
gist --title "Example gist 1" script.ts
gist --t "Example gist 2" script2.ts
```

```
deno install catj https://deno.land/examples/catj.ts --allow-read
catj example.json
catj file1.json file2.json
echo example.json | catj -
```
