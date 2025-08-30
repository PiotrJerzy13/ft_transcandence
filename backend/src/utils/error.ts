// Custom error classes for the application

export class BadRequestError extends Error {
  public statusCode: number;
  
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
    this.statusCode = 400;
  }
}

export class UnauthorizedError extends Error {
  public statusCode: number;
  
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

export class ForbiddenError extends Error {
  public statusCode: number;
  
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

export class NotFoundError extends Error {
  public statusCode: number;
  
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class ConflictError extends Error {
  public statusCode: number;
  
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

export class InternalServerError extends Error {
  public statusCode: number;
  
  constructor(message: string = 'Internal server error') {
    super(message);
    this.name = 'InternalServerError';
    this.statusCode = 500;
  }
}
