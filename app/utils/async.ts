export const sleep = (time: number) => {
  return new Promise<void>(resolve => {
    setTimeout(resolve, time);
  });
};

/**
 * Wraps a promise to be resolved at a later time.
 */
export class Deferred<T> {
  promise: Promise<T>;
  resolved: boolean = false;
  rejected: boolean = false;

  private _resolve: (value: T | PromiseLike<T> | undefined) => void;
  private _reject: (reason: any) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  resolve(value: T | PromiseLike<T> | undefined): void {
    this.resolved = true;
    this._resolve(value);
  }

  reject(reason: any): void {
    this.rejected = true;
    this._reject(reason);
  }
}
