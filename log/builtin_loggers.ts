import { Logger } from "./logger.ts"
import { LogLevel, logLevels } from "./levels.ts"

export class FileLogger<M = unknown, A = unknown, L extends { [level: string]: LogLevel } = typeof logLevels> extends Logger<M, A, L> {
    constructor(
        logLevel: L[keyof L],
        public readonly fileName: string,
    ) {
        super(logLevel)
    }

    protected override handle(logLevel: L[keyof L], message: M, additionalData: A) {
        const messageString = this.buildMessage(logLevel, message, additionalData)

        Deno.writeTextFileSync(this.fileName, messageString, { append: true })
    }
}

export class ConsoleLogger<M = unknown, A = unknown, L extends { [level: string]: LogLevel } = typeof logLevels> extends Logger<M, A, L> {
    #isErrorLevel: (LogLevel: L[keyof L]) => boolean

    constructor(
        logLevel: L[keyof L],
        readonly isErrorLevel: (logLevel: L[keyof L]) => boolean,
    ) {
        super(logLevel)

        this.#isErrorLevel = isErrorLevel
    }

    protected override handle(logLevel: L[keyof L], message: M, additionalData: A) {
        const messageString = this.buildMessage(logLevel, message, additionalData)

        if (this.#isErrorLevel(logLevel)) {
            console.error(messageString)
        } else {
            console.log(messageString)
        }
    }
}

export class DefaultLogger extends ConsoleLogger<string> {
    constructor(logLevel: (typeof logLevels)[keyof typeof logLevels]) {
        super(
            logLevel,
            level => level === logLevels.error,
        )
    }
}

export const log = new DefaultLogger(logLevels.info)

export class MultiLogger<M = unknown, A = unknown, L extends { [level: string]: LogLevel } = typeof logLevels> extends Logger<M, A, L> {
    constructor(
        logLevel: L[keyof L],
        private readonly loggers: Logger<M, A, L>[],
    ) {
        super(logLevel)
    }

    protected override handle(logLevel: L[keyof L], message: M, additionalData: A) {
        this.loggers.forEach(
            ({ dispatch }) => dispatch(logLevel, message, additionalData)
        )
    }
}


