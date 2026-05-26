export class ParityHttpError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'NETWORK_DISABLED'
      | 'INVALID_URL'
      | 'FORBIDDEN_METHOD'
      | 'REQUEST_FAILED'
      | 'TIMEOUT',
  ) {
    super(message);
    this.name = 'ParityHttpError';
  }
}
