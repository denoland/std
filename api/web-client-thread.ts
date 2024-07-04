// THIS IS SYNCED FROM THE ARTIFACT PROJECT
// TODO publish to standalone repo
import { ArtifactBackchat, PID } from './web-client.types.ts'

/**
 * Thread represents an ai enabled thread, which can be anywhere on the
 * filesystem. Backchat manages these, but once set up, the thread can only be
 * used for sending prompts in.  The thread is used to read session files from
 * for display in the UI.  Backchat is technically a thread and is displayed to
 * the user in the same way, albeit wrapped to indicate admin status.
 */
export class Thread {
  static create(backchat: ArtifactBackchat, pid: PID) {
  }
}
