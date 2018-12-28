import { Logger } from "./logger.ts";
import { BaseHandler } from "./handler.ts";
import { ConsoleHandler } from "./handlers/console.ts";
import { FileHandler } from "./handlers/file.ts";

export class LoggerConfig {
  level?: string;
  handlers?: string[];
}

export interface LoggingConfig {
  handlers?: {
    [name: string]: BaseHandler;
  };
  loggers?: {
    [name: string]: LoggerConfig;
  };
}

const DEFAULT_LEVEL = "INFO";
const DEFAULT_NAME = "";
const DEFAULT_CONFIG: LoggingConfig = {
  handlers: {
    "": new ConsoleHandler("INFO"),
  },

  loggers: {
    "": {
      level: "INFO",
      handlers: [""],
    }
  }
};

const state = {
  handlers: new Map(),
  loggers: new Map(),
  config: DEFAULT_CONFIG,
};

export const handlers = {
  BaseHandler,
  ConsoleHandler,
  FileHandler,
};

export function getLogger(name?: string) {
  if (!name) {
    name = DEFAULT_NAME;
  }

  if (!state.loggers.has(name)) {
    const logger = new Logger("NOTSET", []);
    state.loggers.set(name, logger);
    return logger;
  }

  return state.loggers.get(name);
}

export async function setup(config: LoggingConfig) {
  state.config = config;

  // tear down existing handlers
  state.handlers.forEach(handler => {
    handler.destroy();
  });
  state.handlers.clear();

  // setup handlers
  const handlers = state.config.handlers || {};

  for (const handlerName in handlers) {
    const handler = handlers[handlerName];
    await handler.setup();
    state.handlers.set(handlerName, handler);
  }

  // remove existing loggers
  state.loggers.clear();

  // setup loggers
  const loggers = state.config.loggers || {};
  for (const loggerName in loggers) {
    const loggerConfig = loggers[loggerName];
    const handlerNames = loggerConfig.handlers || [];
    const handlers = [];

    handlerNames.forEach(handlerName => {
      if (state.handlers.has(handlerName)) {
        handlers.push(state.handlers.get(handlerName));
      }
    });

    const levelName = loggerConfig.level || DEFAULT_LEVEL;
    const logger = new Logger(levelName, handlers);
    state.loggers.set(loggerName, logger);
  }
}

setup(DEFAULT_CONFIG);