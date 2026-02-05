import { isAxiosError } from 'axios';

interface ApiError {
  detail?: string;
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const apiError = error.response?.data as ApiError;
    if (apiError?.detail) {
      return apiError.detail;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}
