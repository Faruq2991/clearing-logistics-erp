import { isAxiosError } from 'axios';

interface FastAPIValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface ApiError {
  detail?: string | FastAPIValidationError[];
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const apiError = error.response?.data as ApiError;
    if (apiError?.detail) {
      if (Array.isArray(apiError.detail)) {
        // Handle FastAPI validation errors
        return apiError.detail
          .map((err) => `${err.loc.join(' -> ')}: ${err.msg}`)
          .join('; ');
      }
      // Handle simple string detail errors
      return apiError.detail;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}
