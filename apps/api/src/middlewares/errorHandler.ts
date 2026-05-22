import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default values
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error(
      {
        err,
        method: req.method,
        url: req.url,
        statusCode,
      },
      'Server error'
    );
  } else {
    logger.warn(
      {
        message: err.message,
        method: req.method,
        url: req.url,
        statusCode,
      },
      'Client error'
    );
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    ...(env.NODE_ENV === 'development' && statusCode >= 500
      ? { stack: err.stack }
      : {}),
  });
}
