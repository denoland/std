export const api = {
  fork: {
    description:
      `Fork a repo into a new repo for the user.  Will error if the repo has already been forked.`,
  },
  hasFork: {
    description: `Check if a repo has been forked.`,
  },
  toggleSync: {
    description:
      `Sets a flag to trigger a hook that will push to the repo on every commit on the main branch`,
  },
}
