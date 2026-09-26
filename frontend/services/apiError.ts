/** Corpo de erro padrão do Laravel (422 traz `errors` por campo). */
export type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  status: number;
  /** Corpo JSON original, quando houver (ex.: todos os erros de um 422). */
  body: ApiErrorBody | null;

  constructor(status: number, message: string, body: ApiErrorBody | null = null) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export class UnauthorizedError extends ApiError {
  constructor() {
    super(401, 'Não autorizado');
  }
}
