type Subscriber = (...args: unknown[]) => void

/**
 * Very basic implementation of EventEmitter.
 *
 * @export
 * @class EventEmitter
 */
export class EventEmitter {
  private _subscribers: { [key: string]: Subscriber[] };

  constructor() {
    this._subscribers = {};
  }

  emit(event: string, ...args: unknown[]) {
    const subscribers = this._subscribers[event];
    if (!subscribers) {
      return;
    }

    for (const fn of subscribers) {
      fn(...args);
    }
  }

  addEventListener(event: string, subscriber: Subscriber) {
    if (!this._subscribers[event]) {
      this._subscribers[event] = [];
    }

    this._subscribers[event].push(subscriber);
  }

  removeEventListener(event: string, subscriber: Subscriber) {
    if (!this._subscribers[event]) {
      return;
    }

    this._subscribers[event] = this._subscribers[event].filter(fn => fn !== subscriber);
  }

  on(event: string, subscriber: Subscriber) {
    this.addEventListener(event, subscriber);
  }

  off(event: string, subscriber: Subscriber) {
    this.removeEventListener(event, subscriber);
  }

  prependEventListener(event: string, subscriber: Subscriber) {
    if (!this._subscribers[event]) {
      this._subscribers[event] = [];
    }

    this._subscribers[event].unshift(subscriber);
  }
}