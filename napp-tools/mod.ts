export const print = (pid?: PID, noColor = false) => {
  if (!pid) {
    return '(no pid)'
  }
  const branches = pid.branches.map((segment) => {
    const noSubstring = !segment.startsWith('mac_') &&
      !segment.startsWith('bac_') &&
      !segment.startsWith('act_') &&
      !segment.startsWith('rep_') &&
      !segment.startsWith('the_')
    return colorize(segment, noSubstring, noColor)
  })
  const noSubstring = false
  const repoId = colorize(pid.repoId, noSubstring, noColor)
  return `${repoId}/${pid.account}/${pid.repository}:${branches.join('/')}`
}
export const printPlain = (pid?: PID) => {
  const noColor = true
  return print(pid, noColor)
}

export * from './nappSchema.ts'
