import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]:', err.message || err);
  
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors
    });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
};
