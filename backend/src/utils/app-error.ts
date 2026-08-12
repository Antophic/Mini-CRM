export type ErrorDetails = Record<string, unknown> | Array<Record<string, unknown>>;

export class AppError extends Error {
  readonly code: string;
  readonly details?: ErrorDetails;
  readonly statusCode: number;

  constructor(statusCode: number, message: string, code: string, details?: ErrorDetails) {
    super(message);
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }
}
