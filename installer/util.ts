const isWindows = Deno.platform.os === "win";

export function getHomeDir(): string {
  // In Windows's Powershell $HOME environmental variable maybe null
  // if so use $HOMEPATH instead.
  const { HOME, HOMEPATH } = Deno.env();

  return HOME || HOMEPATH;
}

export function getPath(): string {
  // In Windows's Powershell $PATH not exist, so use $Path instead.
  const { PATH, Path } = Deno.env();

  return PATH || Path;
}
