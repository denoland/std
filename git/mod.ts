/**
 * @module io/git
 * @description
 * Handles all the operations we want to do with git.  Gets passed in the fs
 * that we want to use each time.  Every function call here causes a commit
 */
export { default as init } from './init.ts'
export { default as solidify } from './solidify.ts'
export { default as branch } from './branch.ts'
export { default as stage } from './stage.ts'
