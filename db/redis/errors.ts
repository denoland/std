export class EOFError extends Error {}

export class ConnectionClosedError extends Error {}

export class SubscriptionClosedError extends Error {}

export class ErrorReplyError extends Error {}

export class InvalidStateError extends Error {
  constructor(message?: string) {
    const base = "Invalid state";
    super(message ? `${base}: ${message}` : base);
  }
}
