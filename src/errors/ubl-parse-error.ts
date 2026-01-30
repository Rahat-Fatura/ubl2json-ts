import type { UblParseErrorData } from '../types';

/**
 * UBL XML parse işlemi sırasında oluşan hatalar için özel Error sınıfı
 */
export class UblParseError extends Error {
  public readonly cause?: Error | unknown;

  constructor(data: UblParseErrorData) {
    super(data.message);
    this.name = 'UblParseError';
    this.cause = data.cause;

    if (data.cause instanceof Error) {
      this.stack = `${this.stack}\nCaused by: ${data.cause.stack}`;
    }

    Object.setPrototypeOf(this, UblParseError.prototype);
  }
}
