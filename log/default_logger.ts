import { logLevels } from "./levels.ts"
import { ConsoleLogger } from "./builtin_loggers.ts"

export class DefaultLogger extends ConsoleLogger<string> {
    constructor(logLevel: (typeof logLevels)[keyof typeof logLevels]) {
        super(
            logLevel,
            level => level === logLevels.error,
        )
    }
}

export const log = new DefaultLogger(logLevels.info)

