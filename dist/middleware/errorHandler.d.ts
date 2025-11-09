import { Request, Response, NextFunction } from 'express';
export declare class ErrorHandlerMiddleware {
    static handleError(): (error: Error, req: Request, res: Response, next: NextFunction) => void;
    static handleNotFound(): (req: Request, res: Response, next: NextFunction) => void;
    static asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
    static handleValidationError(): (error: any, req: Request, res: Response, next: NextFunction) => void;
    static handleDatabaseError(): (error: any, req: Request, res: Response, next: NextFunction) => void;
    static handleRateLimitError(): (error: any, req: Request, res: Response, next: NextFunction) => void;
    static handleJWTError(): (error: any, req: Request, res: Response, next: NextFunction) => void;
    static handleTimeoutError(): (error: any, req: Request, res: Response, next: NextFunction) => void;
    static handleCORSError(): (error: any, req: Request, res: Response, next: NextFunction) => void;
}
export declare const handleError: typeof ErrorHandlerMiddleware.handleError, handleNotFound: typeof ErrorHandlerMiddleware.handleNotFound, asyncHandler: typeof ErrorHandlerMiddleware.asyncHandler, handleValidationError: typeof ErrorHandlerMiddleware.handleValidationError, handleDatabaseError: typeof ErrorHandlerMiddleware.handleDatabaseError, handleRateLimitError: typeof ErrorHandlerMiddleware.handleRateLimitError, handleJWTError: typeof ErrorHandlerMiddleware.handleJWTError, handleTimeoutError: typeof ErrorHandlerMiddleware.handleTimeoutError, handleCORSError: typeof ErrorHandlerMiddleware.handleCORSError;
//# sourceMappingURL=errorHandler.d.ts.map